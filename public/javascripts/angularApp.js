var app = angular.module('flapperNews', ['ui.router']);

app.config([
  '$stateProvider',
  '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {

    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl',
        resolve: {
          postPromise: ['posts', function (posts) {
            return posts.getAll();
          }]
        }
      })
      .state('posts', {
        url: '/posts/:id',
        templateUrl: '/posts.html',
        controller: 'PostsCtrl',
        resolve: {
          post: ['$stateParams', 'posts', function($stateParams, posts) {
            return posts.get($stateParams.id);
          }]
        }
      });

    $urlRouterProvider.otherwise('home');
  }
]);

app.factory('posts', ['$http', function($http){
  var o = {
    posts: []
  };

  o.getAll = function() {
    return $http.get('/posts').success(function (data) {
      angular.copy(data, o.posts);
    });
  };
  //now we'll need to create new posts
  //uses the router.post in index.js to post a new Post mongoose model to mongodb
  //when $http gets a success back, it adds this post to the posts object in
  //this local factory, so the mongodb and angular data is the same
  //sweet!
  o.create = function(post) {
    return $http.post('/posts', post).success(function (data) {
      o.posts.push(data);
    });
  };
  //upvotes
  o.upvote = function (post) {
    //use the express route for this post's id to add an upvote to it in the mongo model
    return $http.put('/posts/' + post._id + '/upvote')
      .success(function (data) {
        //if we know it worked on the backend, update frontend
        post.votes += 1;
      });
  };
  //downvotes
  o.downvote = function (post) {
    return $http.put('/posts/' + post._id + '/downvote')
      .success(function (data) {
        post.votes -= 1;
      });
  };
  //grab a single post from the server
  o.get = function (id) {
    //use the express route to grab this post and return the response
    //from that route, which is a json of the post data
    //.then is a promise, a kind of newly native thing in JS that upon cursory research
    //looks friggin sweet; TODO Learn to use them like a boss.  First, this.
    return $http.get('/posts/' + id).then(function (res) {
      return res.data;
    });
  };
  //comments, once again using express
  o.addComment = function (id, comment) {
      return $http.post('/posts/' + id + '/comments', comment);
  };
  //upvote comments
  o.upvoteComment = function (post, comment) {
    return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote')
      .success(function (data) {
        comment.votes += 1;
      });
  };
  //downvote comments
  //I should really consolidate these into one voteHandler function
  o.downvoteComment = function (post, comment) {
    return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/downvote')
      .success(function (data) {
        comment.votes -= 1;
      });
  };
  return o;
}]);

app.controller('MainCtrl', ['$scope', 'posts', function($scope, posts){
  $scope.posts = posts.posts;
  //setting title to blank here to prevent empty posts
  $scope.title = '';
  
  $scope.addPost = function(){
      if($scope.title === '') {return;}
      posts.create({
          title: $scope.title,
          link: $scope.link,
      });
      //clear the values
      $scope.title = '';
      $scope.link = '';
  };
  
  $scope.upvote = function(post) {
      //our post factory has an upvote() function in it
      //we're just calling this using the post we have
      posts.upvote(post);
  };
  $scope.downvote = function (post) {
      posts.downvote(post);
  };
}]);

app.controller('PostsCtrl', ['$scope', 'posts', 'post', function($scope, posts, post){
  $scope.post = post;

  $scope.addComment = function(){
    if($scope.body === '') { return; }
    posts.addComment(post._id, {
      body: $scope.body,
      author: 'user'
    })
    .success(function (comment) {
      $scope.post.comments.push(comment);
    });
    $scope.body = '';
  };
  $scope.upvote = function (comment) {
    posts.upvoteComment (post, comment);
  };
    
  $scope.downvote = function (comment) {
    posts.downvoteComment (post, comment);
  };

}]);

