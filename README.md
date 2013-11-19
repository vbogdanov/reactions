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

API:
------------------
[jsdoc generated documentation](http://htmlpreview.github.io/?http://raw.github.com/vbogdanov/reactions/master/out/index.html)

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



