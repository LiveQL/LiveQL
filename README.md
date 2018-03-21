# LiveQL
LiveQL is a library for implementing live queries in GraphQL. We're currently in beta, so use with caution. 

It can be difficult to maintain live data in a GraphQL application. There are a couple common strategies. You can request updates from your server at some specified interval (polling). You can use the built-in GraphQL subscription operation with WebSockets, or some other form of pub/sub. There are pros and cons to both, but there are times when neither are a great option. Polling can be inefficient. Event subscription can be tedious if there’s a lot of events that can change data. 

LiveQL is most similar to the subscription model. The difference is that instead of subscribing to events that change data, you subscribe directly to the data. This means that regardless of how the data changes, your application can maintain state.

Check out our [wiki](https://github.com/LiveQL/LiveQL/wiki) for more details and documentation!

## Getting Started
Install the [package](https://www.npmjs.com/package/liveql):
```
npm install liveql --save
```
Read the [documentation](https://github.com/LiveQL/LiveQL/wiki) for setup instructions.

### Prerequisites

LiveQL was designed to work with a Node/Express backend and any frontend framework. 

## Contributing

Please submit issues/pull requests if you have feedback or message the LiveQL team to be added as a contributor: liveqlsoftware@gmail.com

## Authors

* **Andrew Fuselier** - [andrewlarry](https://github.com/andrewlarry)

* **Max White** - [meIIow](https://github.com/meIIow)

* **Skylar Escobedo** - [NewSky54](https://github.com/NewSky54)

* **Eric Carrillo** - [saltyandsmiling](https://github.com/saltyandsmiling)

* **Xavyr Moss** - [Xavyr](https://github.com/Xavyr)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
