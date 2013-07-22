Count = new Meteor.Collection("counts");
Expire = new Meteor.Collection("expire");

if (Meteor.isServer) { 
  Meteor.startup(function () {
    var Fiber = Npm.require('fibers');

    Count._ensureIndex({word: 1}, {unique: true})
    // connect the twitter api
    var twit = new twitter({
      consumer_key: '<your key here>',
      consumer_secret: '<your key here>',
      access_token_key: '<your key here>',
      access_token_secret: '<your key here>'
    });

    var filteredWords = {
        'the':'','of':'','and':'','a':'','to':'','in':'','is':'','you':'','that':'','it':'','he':'','was':'','for':'',
        'on':'','are':'','as':'','with':'','his':'','they':'','i':'','at':'','be':'','this':'','have':'','from':'',
        'or':'','one':'','had':'','by':'','word':'','but':'','not':'','what':'','all':'','were':'','we':'',
        'when':'','your':'','can':'','said':'','there':'','use':'','an':'','each':'','which':'','she':'',
        'do':'','how':'','their':'','if':'','will':'','up':'','other':'','about':'','out':'','many':'',
        'then':'','them':'','these':'','so':'','some':'','her':'','would':'','make':'','like':'',
        'him':'','into':'','time':'','has':'','look':'','two':'','more':'','write':'','go':'','see':'',
        'number':'','no':'','way':'','could':'','people':'','my':'','than':'','first':'','water':'',
        'been':'','call':'','who':'','oil':'','its':'','now':'','find':'','long':'','down':'','day':'',
        'did':'','get':'','come':'','made':'','may':'','part':'', 'rt':'', ',': '', 'me':'', 'i\'m':'',
        'just':'', '&amp;': ''
      }

    // callback for data
    twit.stream('statuses/sample', {'language': 'en'}, function(stream) {
        stream.on('data', function(data) {
          Fiber( function() {
            var now = (new Date()).getTime();
            _.each(data.text.split(" "), function(word){
              if (!!word && !(word.toLowerCase() in filteredWords)) {
                  try{
                    Count.insert({word:word, count:1});
                  //pokemon exception -- should just handle key dup error
                  } catch (e) {
                    Count.update({word:word}, {$inc:{count: 1}});
                  }
                  Expire.insert({word:word, created:now});
              }
            });
          }).run();
        });
    });
  });

  Meteor.setInterval(function(){
    var now = (new Date()).getTime();
    // grab all expired words and remove them
    expired = Expire.find({created: {$lt: (now - 20 * 1000)}});
    expired.forEach(function(word){
      Count.update({word:word.word}, {$inc:{count: -1}});
    });
    Expire.remove({created: {$lt: (now - 20 * 1000)}});
  },1000);

//   Meteor.setInterval(function(){
// console.log('**********');
//     mostFreqWords = Count.find({}, {sort: {'count': -1}, limit:5});
//     mostFreqWords.forEach(function(word){
// console.log(word.word + ' - ' + word.count)
//     });
// console.log('**********');
//   },1000);
}
