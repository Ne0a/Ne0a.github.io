axios
  .get("https://www.reddit.com/r/WorldPanorama/new.json?&before=t3_14vdo1u&limit=50&t=week")
  .then(function (response) {
    var users = {};
    var posts = response.data.data.children;
    var promises = [];
    var ignoredUsers = [
      "[deleted]",
      "AutoModerator",
      "Ne0--",
      "xXMstfkrXx",
    ];

    var userPhotos = {
      AutoModerator: "a/1.jpg",
    };

    function processComments(commentsData, postAuthor) {
      var commentCount = commentsData.length;
      for (var j = 0; j < commentCount; j++) {
        var comment = commentsData[j].data;
        var commentAuthor = comment.author;
        var commentScore = comment.score;
    
        if (
          commentAuthor !== username &&
          !ignoredUsers.includes(commentAuthor)
        ) {
          if (!users[commentAuthor]) {
            users[commentAuthor] = {
              postScore: 0,
              commentScore: 0,
              totalScore: 0,
            };
          }
          users[commentAuthor].commentScore += commentScore;
        }
    
        if (comment.replies && comment.replies.data && comment.replies.data.children) {
          processComments(comment.replies.data.children, postAuthor); // Alt yorumları işlerken postun yazarını geçirin
        }
    
        // Yorumun altında cevaplar varsa, cevapların yazarının puanını artırın
        if (
          comment.replies &&
          comment.replies.data &&
          comment.replies.data.children
        ) {
          var replies = comment.replies.data.children;
          for (var k = 0; k < replies.length; k++) {
            var reply = replies[k].data;
            var replyAuthor = reply.author;
            var replyScore = reply.score;
    
            if (replyAuthor === postAuthor) {
              // Yorumu atan kişi, cevaba cevap vermişse puanını artırın
              users[replyAuthor].commentScore += replyScore;
            }
          }
        }
      }
    }
    

    for (var i = 0; i < posts.length; i++) {
      var post = posts[i].data;
      var username = post.author;

      var score = post.score;

      if (!users[username]) {
        users[username] = {
          postScore: 0,
          commentScore: 0,
          totalScore: 0,
        };
      }

      if (score >= 10) {
        users[username].postScore += score + 1;
      } else {
        users[username].postScore += score - 1;
      }

      var promise = axios
        .get("https://www.reddit.com/comments/" + post.id + ".json")
        .then(function (response) {
          var commentsData = response.data[1].data.children;
          processComments(commentsData, username); // username eklenerek çağrıldı
        })
        .catch(function (error) {
          console.log(error);
        });
      promises.push(promise);
    }
    
      Promise.all(promises).then(function () {
        var sortedUsers = [];
        for (var user in users) {
          if (!ignoredUsers.includes(user)) {
            users[user].totalScore =
              users[user].postScore + users[user].commentScore;
            sortedUsers.push([user, users[user].totalScore]);
          }
        }
    
        var tableBody = document.getElementById("puan-tablosu");
        var selectSortBy = document.getElementById("sort-by");
    
        function updateTable(sortBy) {
          sortedUsers.sort(function (a, b) {
            switch (sortBy) {
              case "post":
                return users[b[0]].postScore - users[a[0]].postScore;
              case "comment":
                return users[b[0]].commentScore - users[a[0]].commentScore;
              case "total":
                return b[1] - a[1];
              default:
                return b[1] - a[1];
            }
          });
    
          tableBody.innerHTML = "";
    
          var userCount = Math.min(sortedUsers.length, 10);
          for (var k = 0; k < userCount; k++) {
            var user = sortedUsers[k][0];
            var row = document.createElement("tr");
    
            var rank = document.createElement("td");
            rank.innerHTML = k + 1;
            row.appendChild(rank);
    
            var username = document.createElement("td");
            var userLink = document.createElement("a");
            userLink.href = "https://www.reddit.com/user/" + user;
            userLink.innerHTML = user;
            username.appendChild(userLink);
    
            if (userPhotos.hasOwnProperty(user)) {
              var userPhoto = document.createElement("img");
              userPhoto.src = userPhotos[user];
              userPhoto.alt = user;
              userPhoto.style.verticalAlign = "-7px";
              userPhoto.style.width = "26px";
              userPhoto.style.height = "26px";
              userPhoto.style.marginLeft = "5px";
              username.appendChild(userPhoto);
            }
    
            row.appendChild(username);
    
            var postScore = document.createElement("td");
            postScore.innerHTML = users[user].postScore;
            row.appendChild(postScore);
    
            var commentScore = document.createElement("td");
            commentScore.innerHTML = users[user].commentScore;
            row.appendChild(commentScore);
    
            var totalScore = document.createElement("td");
            totalScore.innerHTML = users[user].totalScore;
            row.appendChild(totalScore);
    
            if (k < 25) {
              switch (sortBy) {
                case "post":
                  postScore.classList.add("text-light");
                  break;
                case "comment":
                  commentScore.classList.add("text-light");
                  break;
                case "total":
                  totalScore.classList.add("text-light");
                  break;
                default:
                  totalScore.classList.add("text-light");
                  break;
              }
              rank.classList.add("text-light-heading");
              username.classList.add("text-light-heading");
            } else {
              rank.classList.add("text-secondary-heading");
              username.classList.add("text-secondary-heading");
              postScore.classList.add("text-secondary");
              commentScore.classList.add("text-secondary");
              totalScore.classList.add("text-secondary");
            }
    
            tableBody.appendChild(row);
          }
        }
    
        selectSortBy.addEventListener("change", function (event) {
          var sortBy = event.target.value;
          updateTable(sortBy);
        });
    
        updateTable("total");
      });
    })
    .catch(function (error) {
      console.log(error);
    });
      
