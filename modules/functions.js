// get video duration
const { getVideoDurationInSeconds } = require('get-video-duration');

const fileSystem = require("fs")

module.exports = {
    
    database: null,
    fileSystem: null,

    callbackFileUpload: function(files, index, savedPaths = [], success = null) {
        const self = this

        if (files.length > index) {

            fileSystem.readFile(files[index].path, function (error, data) {
                if (error) {
                    console.error(error)
                    return
                }

                if (files[index].size > 0) {
                    const filePath = "uploads/" + new Date().getTime() + "-" + files[index].name
                    fileSystem.writeFile(filePath, data, async function (error) {
                        if (error) {
                            console.error(error)
                            return
                        }

                        savedPaths.push(filePath)

                        if (index == (files.length - 1)) {
                            success(savedPaths)
                        } else {
                            index++
                            self.callbackFileUpload(files, index, savedPaths, success)
                        }
                    })

                    fileSystem.unlink(files[index].path, function (error) {
                        if (error) {
                            console.error(error)
                            return
                        }
                    })
                } else {
                    index++
                    self.callbackFileUpload(files, index, savedPaths, success)
                }
            })
        } else {
            success(savedPaths)
        }
    },

    isUserFriend: function (user, friendId) {
        let isFriend = false;
        for (let a = 0; a < user.friends.length; a++) {
            if (user.friends[a]._id.toString() == friendId.toString()) {
                isFriend = true;
                break;
            }
        }
        return isFriend;
    },

    updateUser: async function (user, profileImage, name) {
        /* update in profile views collection.
         * 'user' means the person who viewed the profile.
         */
        await this.database.collection("profile_viewers").updateMany({
            "user._id": user._id
        }, {
            $set: {
                "user.name": name,
                "user.profileImage": profileImage
            }
        });

        /* addPost */
        await this.database.collection("posts").updateMany({
            "uploader._id": user._id
        }, {
            $set: {
                "uploader.name": name,
                "uploader.profileImage": profileImage
            }
        });
        await this.database.collection("posts").updateMany({
            "user._id": user._id
        }, {
            $set: {
                "user.name": name,
                "user.profileImage": profileImage
            }
        });

        /* toggleLikePost */
        await this.database.collection("users").updateMany({
            "notifications.profileImage": user.profileImage
        }, {
            $set: {
                "notifications.$.profileImage": profileImage
            }
        });

        /* postComment */
        await this.database.collection("posts").updateMany({
            "comments.user._id": user._id
        }, {
            $set: {
                "comments.$.user.name": name,
                "comments.$.user.profileImage": profileImage
            }
        });

        /* postReply */

        /* sharePost */
        await this.database.collection("posts").updateMany({
            "shares._id": user._id
        }, {
            $set: {
                "shares.$.name": name,
                "shares.$.profileImage": profileImage
            }
        });

        /* sendFriendRequest */
        await this.database.collection("users").updateMany({
            "friends._id": user._id
        }, {
            $set: {
                "friends.$.name": name,
                "friends.$.profileImage": profileImage
            }
        });
    }
};