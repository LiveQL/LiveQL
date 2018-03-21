const RDL = require('./reactiveDataLayer');

/**
 * This file creates the live directive resolver function. This runs when a field is marked
 * with the @live directive. It stores the data returned from the query in the reactive data
 * layer with a reference to the subscribers of the data. In the event that data has changed,
 * the data is updated in the reactive data layer and the subscribers are added to the
 * notification queue.
 *
 * @param {Function} resolve - The resolver of the field this live directive is attached to.
 * @param {Object} source - The resolution object return from the previous resolver.
 * @param {Object} args - The arguments passed into the directive. E.g. comments @live(id: "123").
 * @param {Object} context - The context object passed in when the server is created.
 * @param {Object} info - Object that stores GraphQL query and schema info.
 */

// now we're cooking with butter

const liveResolver = (resolve, source, args, context, info) => {
  // return resolve().then((val) => {return val}); // uncomment to switch off all liveResolver functionality

  // set context.__Live as live alias
  let live = initializeLive(context);

  //if (info.parentType.toString() === 'Mutation') live.mutation = true;
  // if this is neither a mutation nor live query, resolve without doing anything
  if (!live.handle && !live.mutation) {return resolve().then((val) => {return val})};
  // if this this is the first resolver to be called, set parameters to default
  if (!live.resolverCount) { setLiveDefaults(live) };
  // increment and set to local variable, will stay the same even if live.resolverCount is incremented elsewhere
  const count = live.resolverCount++;

  // The GraphQL type that will be returned from the resolver
  const type = info.returnType;
  // booleans keeping track of whether the resolved value will be an array and/or contain objects
  const isArray = resultIsArray(type);
  const isObject = resultIsObject(type);
  // GraphQL type as String
  let typeString = type.toString();
  // strip off [ ] if it's an array
  if (isArray) {typeString = typeString.substring(1, typeString.length - 1)};
  // The GraphQL type (as a String) that the parent field resolved to
  const parentString = info.parentType.toString();
  const fieldName = info.fieldName;
  let fieldString = setFieldString(fieldName, info.fieldNodes[0].arguments);

  // is this resolver run on a top-level field?
  const rootResolver = (parentString === 'Query' || parentString === 'Mutation')
  // reference keeps track of where we are within the RDL. It stores references to objects
  let reference = live.references[live.referenceCount];
  // looks for corresponding references in live.references
  if (!rootResolver) {reference = checkReference(reference, live, source)};
  //This will resolve an orphan. All parent fields must have @live directive in Schema
  if (!reference && !rootResolver) { return resolve().then((val) => {return val})};
  // sets reference to defaults if top-level resolver
  if (rootResolver) { reference = setReference(source, undefined, getReference(parentString), undefined) };

  let handles = reference.handles;
  live.queue[count] = handles.existing;

  return resolve().then((val) => {

    setFields(isArray, typeString, fieldString, reference);

    if (isObject) {
      reference.replacement[fieldString] = reference.existing[fieldString];
      setReferences(isArray, val, reference.existing[fieldString], live, handles);
    } else {
      diffField(reference.existing[fieldString], val, isArray, false, handles.existing);
      diffField(reference.replacement[fieldString], val, isArray, false, handles.replacement);
    };

    if (!live.mutation) {
      reference.existing[fieldString].subscribers[live.handle] = true; // add current handle to subscribers
      reference.replacement[fieldString].subscribers[live.handle] = true; // add current handle to subscribers
    }

    if (fieldName === live.uid) {
      setToID(val, reference, handles, live, count);
    }

    if (!!args.del) {
      handles.existing = Object.assign( handles.existing, reference.existing[fieldString].subscribers);
      handles.replacement = Object.assign( handles.replacement, reference.replacement[fieldString].subscribers);
    }

    // console.log('Store', RDL.store['"5a9b26de4d33148fb6718928"']);
    // console.log('Handle Queue', live.queue);
    return val;
  });
};

/**
 * Merges sideways with RDL object of corresponding ID and updates parentField
 *
 * @param {Object} val - current resolved value (or element of it), will be source for child resolvers
 * @param {Object} reference - master reference object
 * @param {Object} handles - contains existingHandles and replacementHandles, keep track of subscibers
 * @param {Object} live - alias for context.__live
 * @param {Int} count - live resolver count determines where to index to within live.queue
 */
function setToID(val, reference, handles, live, count) {
  let id = (typeof val === 'string') ? val : JSON.stringify(val);
  const transfer = getReference(id); //  grabs object with corresponding ID from RDL

  // iterates through fields, transfering new data into RDL object
  let fields = Object.keys(reference.replacement);
  for (let i = 0; i < fields.length; i ++) {
    let field = fields[i];
    let fieldHasArray = Array.isArray(reference.replacement[field].data);
    if (!transfer[field]) {transfer[field] = setField(fieldHasArray, reference.replacement[field].type)}
    diffField(transfer[field], reference.replacement[field].data, fieldHasArray, false, handles.replacement);
    Object.assign(transfer[field].subscribers, reference.replacement[field].subscribers);
  }

  // resets replacement to be reference to RDL object
  reference.replacement = transfer;
  reference.existing = transfer;

  // go back into parent field and replace with id, check for changes
  if (!Array.isArray(reference.parentField.data)) {
    reference.parentField.data = id;
    if (reference.existingData !== id) {
      Object.assign(handles.replacement, reference.parentField.subscribers);
    };
  } else {
    reference.parentField.data[reference.parentIndex] = id;
    if (reference.existingData[reference.parentIndex] !== id) {
      Object.assign(handles.replacement, reference.parentField.subscribers);
    };
    reference.parentIndex++;
  }

  // switch handles[count] from existing to replacement handles
  live.queue[count] = handles.replacement;
}

/**
 * Checks if there is a valid reference for current resolver in live.references
 *
 * @param {Object} reference - current possible reference match - it was next up in queue
 * @param {Object} live - alias for context.__live
 * @param {Object} source - reference to parent resolved object, 'key' to checking if reference is a match
 */
function checkReference(reference, live, source) {
  if (!reference) { return false; }; // nothing left in the reference queue
  if (reference.source !== source) {
    reference = live.references[live.referenceCount+1];
    if (!reference || reference.source !== source) { // neither the first or second reference match
      return false;
    } else { //  this is the first resolver for a new reference object
      live.referenceCount ++;
      return reference;
    }
  }
  // the current resolver is already a match
  return reference;
}

// Context should contain a __live field that wraps values set in the LiveQL middleware - this sets it if missing
function initializeLive(context) {
  if (!context.__live) {
    context.__live = {};
  }
  context.__live.uid = context.__live.uid || 'id';
  //context.__live.handle = context.__live.handle || 'Placeholder';
  return context.__live;
}

// Sets certain defaults in the __live object the first time a live resolver is called
function setLiveDefaults(live) {
  // keeps track of how many times this liveResolver has been called so far
  live.resolverCount = 0;
  // keeps track of how many times we've moved on to the next reference
  live.referenceCount = 0;
  // list of all reference objects, iterate through like a queue
  live.references = [];
  // list of all subscriber handles that have been changed, should have been set in GraphQL middleware
  if (!live.queue) {live.queue = []};
}

// Determines if GraphQL will resolve an array by checking its string for brackets
function resultIsArray(type) {
  const typeString = type.toString()
  return (typeString[0] === '[' && typeString[typeString.length-1] === ']')
}

// Determines if GraphQL will resolve an object, looks for nested TypeConfig property in type
function resultIsObject(type) {
  const typeObj = (resultIsArray(type)) ? type.ofType: type;
  return (!!typeObj._typeConfig)
}


/**
 * Generates new reference objects and pushes to references object in context.__live
 *
 * @param {Boolean} isArray - whether our value is an array
 * @param {Object || [Object]} val - the resolved value of the GraphQL resolver, must be object
 * @param {Object} field - field on parent RDL object, has data, subscriptions and type
 * @param {Object} live - alias for context.__live
 * @param {Object} handles - contains existingHandles and replacementHandles, keep track of subscibers
 */
function setReferences(isArray, val, field, live, handles) {
  // console.log('---------------------------SETTING A REFERENCE---------------------------------');
  const existingData = field.data
  const data = shuffleData(isArray, field, val, handles);
  if (!isArray) {
    live.references.push(setReference(val, field, data, existingData));
  } else {
    val.forEach((obj, i) => {
      live.references.push(setReference(obj, field, data[i], existingData[i], i));
    });
  }
}

/**
 * Generate single reference object
 *
 * @param {Object} source - current resolved value (or element of it), will be source for child resolvers
 * @param {Object} parentField - field on parent RDL object, has data, subscriptions and type
 * @param {Object} existing - object that is reference back to parentField in which to build nested object
 * @param {ID || [ID] || Object || [Objects]} existingData - the old value of parentField.data
 * @param {Int} i - tells child fields where to index to within parentField data arrays
 */
function setReference(source, parentField, existing, existingData, i) {
  return {
    existing,
    parentField,
    existingData,
    source,
    parentIndex: i,
    replacement: {},
    handles: {
      existing: {},
      replacement: {}
    }
  };
}

/**
 * Creates new object(s) or grabs references to existing ones for building RDL
 *
 * @param {Boolean} isArray - whether our value is an array
 * @param {Object} field - field on parent RDL object, has data, subscriptions and type
 * @param {Object || [Object]} val - the resolved value of the GraphQL resolver, must be object
 * @param {Object} handles - contains existingHandles and replacementHandles, keep track of subscibers
 */
function shuffleData(isArray, field, val, handles) {
  if (!isArray) {
    // we we already have IDs here, we don't want to reassign to nested object
    if (field.identified || typeof field.data === 'string') return {};

    // otherwise, either make new object and reference, or return existing object
    const data = (typeof field.data === 'object') ? field.data: {};
    field.data = data; // not already storing ids
    return data;
  }
  // if there's a mismatch in length between current values and new ones, something changed
  if (field.data.length !== val.length && !field.identified) {
    console.log('Something was added or removed');
    console.log(field.data.length);
    console.log(val.length)
    handles.existing = Object.assign( handles.existing, field.subscribers);
    handles.replacement = Object.assign( handles.replacement, field.subscribers);
  }
  const refs = val.map((obj, i) => {
    // we we already have IDs here, we don't want to reassign to nested object
    if (field.identified || typeof field.data[i] === 'string') return {};

    // otherwise, either make new object and reference, or return existing object
    const data = (typeof field.data[i] === 'object') ? field.data[i]: {};
    field.data[i] = data;
    return data;
  })

  field.data = field.data.slice(0, val.length); //cut'm down to size
  return refs;
}

// Returns RDL object that matches ID, creating new one if neccesary
function getReference(identifier) {
  if (RDL.store[identifier]) return RDL.store[identifier];
  RDL.store[identifier] = {};
  return RDL.store[identifier];
}

// initialized field to default 'empty' state
function setField(isArray, typeString) {
  return ({
    data: (isArray ? [] : undefined),
    subscribers: {},
    type: typeString,
    identified: false
  });
}

// sets fields in reference objects to default state if empty
function setFields(isArray, typeString, fieldString, reference) {
  if (!reference.existing[fieldString]) {
    reference.existing[fieldString] = setField(isArray, typeString)
  }
  if (!reference.replacement[fieldString]) {
    reference.replacement[fieldString] = setField(isArray, typeString)
  }
}

// compares old data to newly resolved data
function diffField(field, val, isArray, isObject, handles) {
  let changed = false;

  if (isArray) {
    // compare each value of new data to old data
    changed = val.reduce((acc, curr, i) => {
      return (acc || curr !== field.data[i]);
    }, false)
    changed = changed || (val.length !== field.data.length);
  } else {
    changed = (field.data !== val)
  }

  if (changed) {
    console.log('-------------THERE WAS A CHANGE------------------')
    field.data = val;
    // add subscribers of this data to list of handles to be fired back
    Object.assign(handles, field.subscribers);
  }
}

// builds fieldString from field resolver string and args array
function setFieldString(fieldString, args) {
  const argString = args.reduce((acc, curr) => {
    const argKey = curr.name.value;
    const argVal = (typeof curr.value.value === 'string') ? curr.value.value : JSON.stringify(curr.value.value);
    return acc + ` ${argKey}: ${argVal}`
  }, '');
  return (!argString.length) ? fieldString : fieldString  + `(${argString} )`;
};

/*
  Templates for  liveResolver Objects:

  Single Reference
  {
    source: {...} // reference to what the source of this child field is
    existing: {...} // object you're building in case this is nested
    replacement: {...} / object you're building in case you gotta combine with / make new top-level RDL object
    existingData: // current values of parentField, for diffing
    parentField: // reference back to the object within parent containing references to current data
    handles: {
      replacement: {...} // handles if we end up replacing
      existing: {...} // default handles if we don't end up replacing
    }
  }

  context.__live
  {
    references: [{...}, {...}, ...] // each object in references is a reference object
    resolverCount: int // keeps track of how many live resolvers have run
    referenceCount: int //  keeps track of which index to reference to in references
    nestedCount: int // keeps track of number of unresolved id fields
    directive: // the alias of the live directive
    handle: string // the hashed identifier for a specific subscription
    uid: string // the field name of their special id variable
  }

  RDL Object
  uniquIDStringdjkfsajk: {
    field1: {
      data: [...] or scalar or {...}
      subscribers: {sub1: true, sub2: true, ...}
      type:
      ids: bool ???
    }
    field2: {...}
    ...
  }
*/

module.exports = liveResolver;
