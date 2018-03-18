# LiveQL
LiveQL is a library for implementing live queries in GraphQL. We're currently in beta, so use with caution. 

It can be difficult to maintain live data in a GraphQL application. There are a couple common strategies. You can request updates from your server at some specified interval (polling). You can use the built in GraphQL subscription operation with WebSockets, or some other form of pub/sub. There are pros and cons to both, but there are times when neither are a great option. Polling can be inefficient. Event subscription can be tedious if there’s a lot of events that can change data. 

LiveQL is most similar to the subscription model. The difference is that instead of subscribing to events that change data, you subscribe directly to the data. This means that regardless of how the data changes, you’re application can maintain state.

Check out our wiki for more details and documentation!

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

```
Give examples
```

### Installing

A step by step series of examples that tell you have to get a development env running

Say what the step will be

```
Give the example
```

And repeat

```
until finished
```

End with an example of getting some data out of the system or using it for a little demo

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
