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


 // conte

const liveResolver = (resolve, source, args, context, info) => {

  // return resolve().then((val) => {return val}); // uncomment to switch off all liveResolver functionality

  // assign 'live' alias
  let live = initializeLive(context);

  // do these all need to be variables?
  const handle = live.handle; // || 'Temporary Handle';
  const alias = live.directive || 'live';
  const idField = live.uid || 'id';
  const mutation = live.mutation;
  const del = (!!args.del);

  // if this is neither a mutation nor live query, resolve without doing anything
  if (!handle && !mutation) {return resolve().then((val) => {return val})};

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

  // if there is no context and it's not top-level, immediately resolve
  if (!reference && !rootResolver) {
    // console.log('This will resolve an orphan. You should add @live to the parent field in the Schema');
    // console.log('Or maybe you\'re a hacker tryn\'a subscribe within fields you aren\'t s\'posta. Naughty.');
    return resolve().then((val) => {return val});
  }

  if (rootResolver) {
    reference = setReference(source, undefined, getReference(parentString), undefined);
  }

  // stores existingHandles and replacementHandles
  // when a subscriber's data is changed, add them to corresponding handle
  let handles = reference.handles;

  // live.queue is growing array of subscribers whose data has been changed, indexed by resolver count
  live.queue[count] = handles.existing;

  //console.log('outer resolve', reference)

  return resolve().then((val) => {
    // console.log('inner resolve', reference.replacement, reference.existing)
    setFields(isArray, typeString, fieldString, reference);

    if (isObject) {
      reference.replacement[fieldString] = reference.existing[fieldString];
      setReferences(isArray, val, reference.existing[fieldString], live);
    } else {

      //field, val, isArray, isObject, handles
      diffField(reference.existing[fieldString], val, isArray, false, handles.existing);
      diffField(reference.replacement[fieldString], val, isArray, false, handles.replacement);
    };

    if (!mutation) {
      reference.existing[fieldString].subscribers[handle] = true; // add current handle to subscribers
      reference.replacement[fieldString].subscribers[handle] = true; // add current handle to subscribers
    }

    if (fieldName === idField) {
      setToID(val, reference, handles, live, count);
    }
    if (del) {
      handles.existing = Object.assign( handles.existing, reference.existing[fieldString].subscribers);
      handles.replacement = Object.assign( handles.replacement, reference.replacement[fieldString].subscribers);
    }
    // console.log('Query', RDL.store);
    return val;
  });
};

/*
  Skeleton of reference object
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

  Skeleton of live object
  {
    references: [{...}, {...}, ...] // each object in references is a reference object
    resolverCount: int // keeps track of how many live resolvers have run
    referenceCount: int //  keeps track of which index to reference to in references
    nestedCount: int // keeps track of number of unresolved id fields
    directive: // the alias of the live directive
    handle: string // the hashed identifier for a specific subscription
    uid: string // the field name of their special id variable
  }

  Skeleton of RDL object
  uniquIDStringdjkfsajk: {
    field: {
      data: [...] or scalar or {...}
      subscribers: {sub1: true, sub2: true, ...}
      type:
      ids: bool ???
    }
  }
*/


function setToID(val, reference, handles, live, count) {
  let id = (typeof val === 'string') ? val : JSON.stringify(val);
  // console.log('this object has an id');
  // combine replacement with object with that id
  const transfer = getReference(id);
  let fields = Object.keys(reference.replacement);
  // console.log('fields', fields);
  for (let i = 0; i < fields.length; i ++) {
    let field = fields[i];
    // diffField(field, val, isArray, isObject, handles)
    let fieldHasArray = Array.isArray(reference.replacement[field].data);
    if (!transfer[field]) {transfer[field] = setField(fieldHasArray, reference.replacement[field].type)}
    diffField(transfer[field], reference.replacement[field].data, fieldHasArray, false, handles.replacement);
    Object.assign(transfer[field].subscribers, reference.replacement[field].subscribers);
  }
  reference.replacement = transfer;
  // go back into parent field and replace with id, check for changes

  if (!Array.isArray(reference.parentField.data)) {
    reference.parentField.data = id; // TODO this could be an issue
    if (reference.existingData !== id) {
      Object.assign(handles.replacement, reference.parentField.subscribers);
    };
  } else {
    reference.parentField.data[reference.parentIndex] = id; // TODO this could be an issue
    if (reference.existingData[reference.parentIndex] !== id) {
      Object.assign(handles.replacement, reference.parentField.subscribers);
    };
    reference.parentIndex++;
  }

  // switch handles[count] to replacement handles
  live.queue[count] = handles.replacement;
}

function checkReference(reference, live, source) {
  if (!reference) { return false; };
  if (reference.source !== source) {
    reference = live.references[live.referenceCount+1];
    if (!reference || reference.source !== source) {
      return false;
    } else {
      // console.log('BEGINNING TO RESOLVE FIELDS ON NEW OBJECT');
      live.referenceCount ++;
      return reference;
    }
  }
  return reference;
}

function initializeLive(context) {
  if (!context.__live) {
    context.__live = {};
  }
  return context.__live;
}

function setLiveDefaults(live) {
  // keeps track of how many times this liveResolver has been called so far
  live.resolverCount = 0;

  // keeps track of how many times we've moved on to the next reference
  live.referenceCount = 0;

  // list of all reference objects, iterate through like a queue
  live.references = [];

  // list of all subscriber handles that have been changed
  if (!live.queue) {live.queue = []};

  live.nestedCount = 0;
}

function resultIsArray(type) {
  const typeString = type.toString()
  return (typeString[0] === '[' && typeString[typeString.length-1] === ']')
}

function resultIsObject(type) {
  const typeObj = (resultIsArray(type)) ? type.ofType: type;
  return (!!typeObj._typeConfig)
}

function setReferences(isArray, val, field, live) {
  // console.log('---------------------------SETTING A REFERENCE---------------------------------');
  const existingData = field.data
  const data = shuffleData(isArray, field, val);
  if (!isArray) {
    live.references.push(setReference(val, field, data, existingData));
  } else {
    val.forEach((obj, i) => {
      live.references.push(setReference(obj, field, data[i], existingData[i], i));
    });
  }
}

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

function shuffleData(isArray, field, val) {
  if (!isArray) {
    if (field.identified || typeof field.data === 'string') return {};
    const data = (typeof field.data === 'object') ? field.data: {};
    field.data = data; // not already storing ids
    return data;
  }
  if (field.data.length !== val.length && !field.identified) {
    // ruh roh, already a difference
  }
  const refs = val.map((obj, i) => {
    if (field.identified || typeof field.data[i] === 'string') return {};
    const data = (typeof field.data[i] === 'object') ? field.data[i]: {};
    field.data[i] = data;
    return data;
  })

  field.data = field.data.slice(0, val.length); //cut'm down to size

  return refs;
}

function getReference(identifier) {
  if (RDL.store[identifier]) return RDL.store[identifier];
  RDL.store[identifier] = {};
  return RDL.store[identifier];
}

function setField(isArray, typeString) {
  // initialized field to default 'empty' state
  return ({
    data: (isArray ? [] : undefined),
    subscribers: {},
    type: typeString,
    identified: false
  });
}

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
    // console.log('-------------THERE WAS A CHANGE------------------')
    field.data = val;

    // add subscribers of this data to list of handles to be fired back
    Object.assign(handles, field.subscribers);
  }
}

function setFieldString(fieldString, args) {
  const argString = args.reduce((acc, curr) => {
    const argKey = curr.name.value;
    const argVal = (typeof curr.value.value === 'string') ? curr.value.value : JSON.stringify(curr.value.value);
    return acc + ` ${argKey}: ${argVal}`
  }, '');
  return (!argString.length) ? fieldString : fieldString  + `(${argString} )`;
};

module.exports = liveResolver;
