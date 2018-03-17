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

  // return resolve().then((val) => {return val});
  if (!context.__live) {
    console.log(`no context.__live was set. That is srsly messed up. What's a guy to do?`)
    context.__live = {};
  }

  // reassign to 'live' alias
  let live = context.__live;

  const handle = 'I AM A HANDLE' //live.handle || '';
  const alias = 'live' //live.directive;
  const idField = 'id' //live.uid;

  // if this this is the first resolver to be called, set parameters to default
  if (!live.resolverCount) {

    // keeps track of how many times this liveResolver has been called so far
    live.resolverCount = 0;

    // keeps track of how many times we've moved on to the next reference
    live.referenceCount = 0;

    // list of all reference objects, iterate through like a queue
    live.references = [];

    // list of all subscriber handles that have been changed
    live.handles = [];
  }

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

  // The GraphQL type as a String that the parent field resolved to
  const parentString = info.parentType.toString();

  const fieldName = info.fieldName;
  let fieldString = setFieldString(fieldName, info.fieldNodes[0].arguments);

  // is this resolver run on a top-level field?
  const rootResolver = (parentString === 'Query' || parentString === 'Mutation')

  // the resolved value is an orphan if no parent set a reference point for it
  let orphan = false;

  // reference keeps track of where we are within the RDL. It stores references to objects
  let reference = live.references[live.referenceCount];

  if (!reference) {
    orphan = true;
  } else if (reference.source !== source) {
    reference = live.references[live.referenceCount+1];
    if (!reference || reference.source !== source) {
      console.log('This will resolve an orphan. You should add @live to the parent field in the Schema');
      // if (reference) console.log('reference.source', reference.source);
      // console.log('source', source);
      orphan = true;
    } else {
      live.referenceCount ++;
    }
  }

  if (rootResolver || orphan) {
    reference = setReference(source, null, getReference(parentString), null);
  }

  // stores existingHandles and replacementHandles
  // when a subscriber's data is changed, add them to corresponding handle
  let handles = reference.handles;

  // live.handles is growing array of subscribers whose data has been changed, indexed by resolver count
  live.handles[count] = handles.existing;

  //console.log('outer resolve', reference)

  return resolve().then((val) => {
    // console.log('inner resolve', reference)


    setFields(isArray, typeString, fieldString, reference);

    // looks for differences between existing data and new data
    // diffField(store[field], val, isArray, isObject, handles);

    //console.log('set fields');

    // sets context for nested resolvers

    // KEEP CHILD POINTED TO RIGHT PARENTSTRING
    if (isObject) {

      //(isArray, val, field)
      //console.log('YYYYYYYY', reference.existing[fieldString]);
      reference.replacement[fieldString] = reference.existing[fieldString];
      setReferences(isArray, val, reference.existing[fieldString], live);
      //console.log('-------object reset refs---------', live.reference);
    } else {

      //field, val, isArray, isObject, handles
      diffField(reference.existing[fieldString], val, isArray, false, handles.existing);
      diffField(reference.replacement[fieldString], val, isArray, false, handles.replacement);
    };

    //console.log('set context');

    reference.existing[fieldString].subscribers[handle] = true; // add current handle to subscribers
    reference.replacement[fieldString].subscribers[handle] = true; // add current handle to subscribers

    if (fieldName === idField) {
      console.log('this object has an id');
      // combine replacement with object with that id
      const x = getReference(val);
      let fields = Object.keys(reference.replacement);
      //console.log('fields', fields);
      for (field of fields) {
        // diffField(field, val, isArray, isObject, handles)
        let fieldHasArray = Array.isArray(reference.replacement[field].data);
        if (!x[field]) {x[field] = setField(fieldHasArray, reference.replacement[field].type)}
        diffField(x[field], reference.replacement[field].data, fieldHasArray, false, handles.replacement);
        Object.assign(x[field].subscribers, reference.replacement[field].subscribers);

        // TODO - have way of making sure child parentFields have reference back up to right field
        //console.log('SHOULD NOT BE NULL', x[field])
        reference.replacement[field] = x[field];

      }
      reference.replacement = x;
      // go back into parent field and replace with id, check for changes
      console.log('5******');
      // console.log(reference);

      if (!Array.isArray(reference.parentField)) {
        console.log('not arr');
        reference.parentField.data = val; // TODO this could be an issue
        console.log('******5');
        if (reference.existingData !== val) {
          Object.assign(handles.replacement, reference.parentField.subscribers);
        };
      } else {
        console.log('arr');
        reference.parentField.data[index] = val; // TODO this could be an issue
        console.log('******5');
        if (reference.existingData[index] !== val) {
          Object.assign(handles.replacement, reference.parentField.subscribers);
        };
      }

      // switch handles[count] to replacement handles
      live.handles[count] = handles.replacement;

    }

    // console.log('references', live.reference);
    // console.log('handles', live.handles);
    console.log('RDL', RDL.store);
    // console.log('Query', RDL.store.Query);
    // console.log('val', val);
    return val;
  });
};

function resultIsArray(type) {
const typeString = type.toString()
return (typeString[0] === '[' && typeString[typeString.length-1] === ']')
}

function resultIsObject(type) {
typeObj = (resultIsArray(type)) ? type.ofType: type;
return (!!typeObj._typeConfig)
}

// figures out context info of single object or array of objects
function setLiveContext(typeString, isArray, val) {
if (!isArray) return setOneLiveContext(typeString, val._id);
return val.map((obj, i) => {
  obj.live = i;
  return setOneLiveContext(typeString, obj.id);
})
}

// creates (if neccesary) and returns context of a single object
function setOneLiveContext(typeString, id) {
if (!RDL.store[typeString]) {
  RDL.store[typeString] = {};
}
if (!id) return RDL.store[typeString];
// Check if the object exists in the tree
if (!RDL.store[typeString][id]) {
  RDL.store[typeString][id] = {};
}
return RDL.store[typeString][id]
}

function setReferences(isArray, val, field, live) {
console.log('---------------------------SETTING A REFERENCE---------------------------------');
//console.log('******1');
const existingData = field.data
//console.log('1******');
console.log('FFFFFFFFFF');
const data = shuffleData(isArray, field, val);
console.log('GGGGGGGGGGGGGG');
if (!isArray) {
  console.log('HHHHHHH');
  live.references.push(setReference(val, field, data, existingData));
  console.log('JJJJJJJJ');
} else {
  val.forEach((obj, i) => {
    console.log('IIIIIIIIII');
    //console.log('******4');
    //console.log(field, data);
    //console.log('4******');
    live.references.push(setReference(obj, field, data[i], existingData[i]));
  });
}
//console.log('references', live.references);
}

function setReference(source, parentField, existing, existingData) {
return {
  existing,
  parentField,
  existingData,
  source,
  replacement: {},
  handles: {
    existing: {},
    replacement: {}
  }
};
}

function shuffleData(isArray, field, val) {
if (!isArray) {
  //const data = (typeof field.data === 'object') ? field.data: {};
  const data = {};
  //console.log('****2')
  field.data = data;
  //console.log('2****')
  return data;
}
return val.map((obj, i) => {
  //const data = (typeof obj.data === 'object') ? obj.data: {};
  const data = {};
  //console.log('****3')
  field.data[i] = data;
  //console.log('3****')

  return data;
})
}

function getReference(identifier) {
if (RDL.store[identifier]) return RDL.store[identifier];
RDL.store[identifier] = {};
//console.log('xxxxxxx');
return RDL.store[identifier];
}

function setField(isArray, typeString) {
// initialized field to default 'empty' state
return ({
  data: (isArray ? [] : null),
  subscribers: {},
  type: typeString
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
//console.log('CANNOT BE UNDEFINED', field);
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
  field.data = val; // overwrite field

  // add subscribers of this data to list of handls to be fired back
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
}

module.exports = liveResolver;
