Reactions
=========
[![Build Status](https://travis-ci.org/vbogdanov/reactions.png)](https://travis-ci.org/vbogdanov/reactions)

Reactions is a javascript (node and browser) library based around the 

Reaction 
```javascript
  function (context, done)
``` 
and Done 
```javascript
  function (error, result)
``` 

For general purpose async helpers see [caolan/async](https://github.com/caolan/async Async) - An active project with good documentation

Reaction.fn & Reaction.make
---------------------------
`Reactions.fn` contains functions operating on Reaction functions and accepting initial context and done. For example
```javascript
  Reactions.fn.parallel(arrayOfReactions, context, done);
```
while `Reactions.make` provide functions doing partial execution of the Reactions.fn ones. 
The result of the partial execution matches the Reaction function signature:
```javascript
  var compositeReaction = Reactions.make.parallel(arrayOfReactions)
  compositeReaction(context, done);
```
Note: `Reactions.make` is automatically generated from `Reactions.fn` with the expectation 
that the last two arguments of all functions are context and done.

Reactions.fn.*
-----------------
`parallel(reactions, context, done)` will call all reactions passing the context object and wait 
for all of them to complete or the first error before calling done. 
Only the first error is passed to done. The original context (eventually changed by the reactions) is passed to done.

`collectParallel(reactions, context, done)` same as parallel, except on success an array containing the results from all reactions is passed to done.

`serial(reactions, context, done)` will call the reactions in order passing the original context. 
The next functions is executed after the callback of the previous is invoked.
Upon the first error or successful completion of all functions the done callback is invoked.
The original context (eventually changed by the reactions) is passed to done.

`collectSerial(reactions, context, done)` same as serial except on success an array of the results from all reactions is passed to done.

`waterfall(reactions, context, done)` will execute each function in order and pass the result of it to the next as context
The original context is passed to the first function, the result of the last one is passed as data to done. 
Executions is stopped on the first error and the `done(error)` is invoked.

Utility functions
------------------
```javascript
 Reactions.done(defaultDone, success);
```
Creates a Done function that:
*   will invoke defaultDone(error) on error
*   will invoke success(data) if success is a function, defaultDone(false, data) otherwise
*   can be invoked only once (and throws exception on subsequent calls)
*   its execution is delayed (enqueued as an event)

