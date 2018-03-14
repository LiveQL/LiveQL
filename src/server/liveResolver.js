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
   // const isLive = info.fieldNodes[0].directives.reduce((acc, curr) => {
   //   return (acc || curr.name.value === 'live')
   // }, false);
   //
   // if (!isLive) return resolve();
   console.log('live!');

   // hard-coded for now, for demo will grab from RDL
   let handle = 'I AM A HANDLE';

   // The GraphQL type that will be returned from the resolver
   const type = info.returnType;

   const isArray = resultIsArray(info.returnType);
   const isObject = resultIsObject(info.returnType);

   let typeString = type.toString();
   // strip off [ ] if it's an array
   if (isArray) {typeString = typeString.substring(1, typeString.length - 1)};

   // true if this is the first resolver
   const rootResolver = !context.live;
   console.log('XXXXXXXXXX', info.fieldNodes[0].directives);

   // if first resolver, set context.live
   if (rootResolver) {
     // console.log('root', info.fieldNodes[0].selectionSet.selections[0].directives);
     // console.log('root', info.schema._directives[0].astNode.locations[0].loc);
     // console.log('YYYYYYYYYYYYYYYYYYYY', info.fieldNodes[0].directives);
     context.live = {};
     context.live.location = setOneLiveContext(typeString);
     context.live.handles = {};
   }

   // store lets us know where we are within the RDL
   let store = context.live.location;
   let handles = context.live.handles;

   // grabs correct location from context if they were set by an array
   if (Array.isArray(store)) {
     store = store[source.live]; // added live prop to source in last resursish step
   }

   return resolve().then((val) => {

     if (rootResolver && !isArray) {
       const id = val._id; // gonna have to change this

       // The current object with this id doesn't exist in the RDL
       if (!store[id]) {
         store[id] = {};
       }
       context.live.location = store[id];
     } else {
       const field = info.fieldName;
       if (!store[field]) {
         store[field] = setField(isArray, typeString);
       }

       // looks for differences between existing data and new data
       diffField(store[field], val, isArray, isObject, handles);

       // sets context for nested resolvers
       if (isObject) {context.live.location = setLiveContext(typeString, isArray, val)};

       store[field].subscribers[handle] = true; // add current handle to subscribers
     }
     // console.log(handles);
     // console.log(RDL.data.Comment);
     return val;
   });
 },
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

function setField(isArray, typeString) {
 // initialized field to default 'empty' state
 return ({
   data: (isArray ? [] : null),
   subscribers: {},
   type: typeString
 });
}

// compares old data to newly resolved data
function diffField(field, val, isArray, isObject, handles) {
 let comp;
 let changed = false;

 if (isArray) {
   comp = val.map((obj, i) => {return setComparison(obj, isObject)});

   // compare each value of new data to old data
   changed = val.reduce((acc, curr, i) => {
     return (acc || curr !== field.data[i]);
   }, false)
   changed = changed || (comp.length !== field.data.length);

 } else {
   comp = setComparison(val, isObject);
   changed = (field.data !== comp)
 }

 if (changed) {
   console.log('-------------THERE WAS A CHANGE------------------')
   field.data = comp; // overwrite field

   // add subscribers of this data to list of handls to be fired back
   Object.assign(handles, field.subscribers);
 }
}

// grabs id if object, val if scalar
function setComparison(val, isObject) {
 return (isObject) ? val._id : val;
}

module.exports = liveResolver;
