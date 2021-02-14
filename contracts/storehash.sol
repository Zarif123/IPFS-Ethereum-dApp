// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.0;

contract StoreHash {

    struct newsUpdate {
        address user;
        string username;
        string bio;
        string timeStamp;
        string location;
        string fileHash;
        string imageHash;
        string category;
        string extension;
    }

    struct Profile{
        bytes32 name;
        bytes32 bio_1;
        bytes32 bio_2;
        bytes32 bio_3;
    }

    newsUpdate[] public newsList;
    mapping(address => uint) public userReputation;
    mapping(string => int) public postReputation;
    mapping(string => mapping(address => bool)) public postToAccess;

    mapping(address => Profile) public userProfile;

    event storageUpdate(string newValue, address updatedBy);

    function sendUpdate(string memory ipfsHash,string memory location, string memory time, string memory imageHash,string memory category, string memory extension) public {
        newsList.push(newsUpdate({
            user:msg.sender,
            username: this.bytes32ToString(userProfile[msg.sender].name),
            bio_1: userProfile[msg.sender].bio_1,
            bio_2: userProfile[msg.sender].bio_1,
            bio_3: userProfile[msg.sender].bio_1,
            timeStamp:time,
            location:location,
            fileHash: ipfsHash,
            imageHash: imageHash,
            category: category,
            extension: extension
        }));
        //initialize the post vote to zero
        postReputation[ipfsHash] = 0;
        postToAccess[ipfsHash][msg.sender] =true;
        if (userReputation[msg.sender] != 0x0){
             userReputation[msg.sender]+=10;
        }else{
            userReputation[msg.sender]=10;
        }
    }

    function getUpdate() public view returns (newsUpdate[] memory) {
        return newsList;
    }

    function getReputation(address account) public view returns (uint){
        return userReputation[account];
    }

    function increaseReputation(address account, uint amount) public  {
        userReputation[account] +=amount;
    }

    function decreaseReputation(address account, uint amount) public  {
        require(userReputation[account]>amount);
        userReputation[account] -=amount;
    }

    function increaseVote(string memory ipfsHash) public {
        postReputation[ipfsHash]+=1;
    }

    function decreaseVote(string memory ipfsHash) public {
        postReputation[ipfsHash]-=1;
    }

    function getVote(string memory ipfsHash) public view returns (int){
        return postReputation[ipfsHash];
    }
    // to grant access to user to a specfic post

    function grantAccess(string memory ipfsHash, address account) public{
        postToAccess[ipfsHash][account] =true;
    }

    function checkAccess(string memory ipfsHash, address account) public view returns (bool){
        if (postToAccess[ipfsHash][account] == true){
            return true;
        }
        return false;    }

    function getUsername(address account) public view returns (bytes32){
        return userProfile[account].name;
    }

    function setUsername(address account, bytes32 newName) public{
        userProfile[account].name = newName;
    }

    function getBio(address account) public view returns (string memory){
        return string(abi.encodePakced(
          bytes32ToString(userProfile[account].bio_1),
          bytes32ToString(userProfile[account].bio_2),
          bytes32ToString(userProfile[account].bio_3)
          ));
    }

    function setBio(address account,
      bytes32 newBio_1, bytes32 newBio_2, bytes32 newBio_3) public{
        userProfile[account].bio_1 = newBio_1;
        userProfile[account].bio_2 = newBio_2;
        userProfile[account].bio_3 = newBio_3;
    }

    function setProfile(address account, bytes32 newName,
      bytes32 newBio_1, bytes32 newBio_2, bytes32 newBio_3) public{
        userProfile[account].name = newName;
        userProfile[account].bio_1 = newBio_1;
        userProfile[account].bio_2 = newBio_2;
        userProfile[account].bio_3 = newBio_3;
    }

    function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

}
