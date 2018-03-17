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

 const liveResolver = (resolve, source, args, context, info) => {

   // return resolve().then((val) => {return val});
   if (!context.__live) {
     console.log(`no context.__live was set. That is srsly messed up. What's a guy to do?`)
     context.__live = {};
   }

   const handle = 'I AM A HANDLE' //context.__live.handle || '';
   const alias = 'live' //context.__live.directive;
   const idField = 'id' //context.__live.uid;

   if (!context.__live.count) { // this is the first resolver to be called
     context.__live.count = 0;
     context.__live.reference = {};
     context.__live.handles = [];
   }
   const count = context.__live.count++;

   // The GraphQL type that will be returned from the resolver
   const type = info.returnType;

   // The GraphQL type that this is a field of
   const parent = info.parentType;

   const isArray = resultIsArray(type);
   const isObject = resultIsObject(type);

   let typeString = type.toString();
   if (isArray) {typeString = typeString.substring(1, typeString.length - 1)}; // strip off [ ] if it's an array

   const parentString = parent.toString();

   const fieldName = info.fieldName;
   let fieldString = setFieldString(fieldName, info.fieldNodes[0].arguments);

   const rootResolver = (parentString === 'Query' || parentString === 'Mutation')

   let reference = context.__live.reference;

   const fromArray = Array.isArray(reference);
   let index;
   if (fromArray) {
     index = source.__liveIndex
     reference = reference[index]; // added live prop to source in last resursish step
   }

   const orphan = (!reference || reference.source !== source);

   if (rootResolver || orphan) {
     //console.log('ZZZZZZZZZZZZZ', source, reference);
     context.__live.reference = setReference(source, null, getReference(parentString), null);
     reference = context.__live.reference;
   }

   // store lets us know where we are within the RDL

   // grabs correct location from context if they were set by an array

   let handles = reference.handles;
   context.__live.handles[count] = handles.existing;

   //console.log('outer resolve', reference)

   return resolve().then((val) => {
     console.log('inner resolve')
     console.log(reference);

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
       context.__live.reference = setReferences(isArray, val, reference.existing[fieldString]);
       //console.log('-------object reset refs---------', context.__live.reference);
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
       //console.log('5******');
       // console.log(reference);

       if (!fromArray) {
         reference.parentField.data = val; // TODO this could be an issue
         //console.log('******5');
         if (reference.existingData !== val) {
           Object.assign(handles.replacement, reference.parentField.subscribers);
         };
       } else {
         reference.parentField.data[index] = val; // TODO this could be an issue
         //console.log('******5');
         if (reference.existingData[index] !== val) {
           Object.assign(handles.replacement, reference.parentField.subscribers);
         };
       }

       // switch handles[count] to replacement handles
       context.__live.handles[count] = handles.replacement;

     }

     // console.log('references', context.__live.reference);
     // console.log('handles', context.__live.handles);
     // console.log('RDL', RDL.data);
     // console.log('Query', RDL.data.Query);
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
 if (!RDL.data[typeString]) {
   RDL.data[typeString] = {};
 }
 if (!id) return RDL.data[typeString];
 // Check if the object exists in the tree
 if (!RDL.data[typeString][id]) {
   RDL.data[typeString][id] = {};
 }
 return RDL.data[typeString][id]
}

function setReferences(isArray, val, field) {
 //console.log('******1');
 const existingData = field.data
 //console.log('1******');
 const data = shuffleData(isArray, field, val);
 if (!isArray) {
   return setReference(val, field, data, existingData);
 }
 return val.map((obj, i) => {
   obj.__liveIndex = i;
   //console.log('******4');
   const oldData = field.data[i];
   console.log(field, data);
   //console.log('4******');
   return setReference(obj, field, data[i], existingData[i]);
 })
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
 if (RDL.data[identifier]) return RDL.data[identifier];
 RDL.data[identifier] = {};
 //console.log('xxxxxxx');
 return RDL.data[identifier];
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

function setFieldString(fieldString, arguments) {
 const argString = arguments.reduce((acc, curr) => {
   const argKey = curr.name.value;
   const argVal = (typeof curr.value.value === 'string') ? curr.value.value : JSON.stringify(curr.value.value);
   return acc + ` ${argKey}: ${argVal}`
 }, '');
 return (!argString.length) ? fieldString : fieldString  + `(${argString} )`;
}

module.exports = liveResolver;
