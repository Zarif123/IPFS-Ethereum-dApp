import React, { Component } from 'react';
//import logo from ‘./logo.svg’;
import './App.css';
import web3 from './web3';
import Web3 from 'web3';
import ipfs from './ipfs';
import storehash from './storehash';
import healthToken from './healthToken';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Table, Button, Form, Row,Col,ListGroup} from 'react-bootstrap';
import ViewNews from "./ViewNews";

//force the browser to connect to metamask upon entering the site
window.addEventListener('load', async () => {
  // Modern dapp browsers...
  if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
          // Acccounts now exposed
          window.ethereum.enable();
          const accounts = await web3.eth.requestAccounts();
          web3.eth.sendTransaction({/* ... */});
      } catch (error) {}
  }
  // Legacy dapp browsers...
  else if (window.web3) {
      window.web3 = new Web3(web3.currentProvider);
      // Acccounts always exposed
      web3.eth.sendTransaction({/* ... */});
  }
  // Non-dapp browsers...
  else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
  }
});

class App extends Component {
 
  constructor() {
    super();
    //bring in user's metamask account address
    this.getWalletAddress();
    this.updateNews();
    // text input
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  //loading the list of hash from the deployed storeHash contract
  updateNews = async() => {
    const pp = await storehash.methods.getHash().call().then(
      (result) => {
        //console.log(result)
        return result
      }
    )
    console.log(this.state.hashList)
    this.setState({hashList: pp})
    console.log(this.state.hashList)
  }
  state = {
    ipfsHash:null,
    verified:true,
    buffer:'',
    ethAddress:'',
    blockNumber:'',
    transactionHash:'',
    gasUsed:'',
    txReceipt: '',
    walletAddress:'' ,
    hashList:[],
    updates:["News1", "News2","News3",3]
  };  

  getWalletAddress = async() =>{
    const accounts =  await web3.eth.getAccounts();
    //console.log(accounts)
    //console.log('Metamask account: ' + accounts[0]);
    this.setState({walletAddress: accounts[0]});
    //console.log('print out address '+this.state.walletAddress);
  }


  //Issue: what we returned here will become a promise with undifbeing called in

  // captureText = (event) => {
  //   event.preventDefault()
  //   console.log('text capture');


  // };

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    const element = document.createElement("a");
    const file = new Blob([this.state.value], {type: 'text/plain'});
    // download that submit file
    // element.href = URL.createObjectURL(file);
    // element.download = "myFile.txt";
    // document.body.appendChild(element); // Required for this to work in FireFox
    // element.click();
    let reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      // console.log('buffer', Buffer(reader.result));
      this.convertToBuffer(reader);
      this.onSubmit(event);
    }
  }

  captureFile =(event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => this.convertToBuffer(reader)    
      };
  convertToBuffer = async(reader) => {
      //file is converted to a buffer for upload to IPFS
        const buffer = await Buffer.from(reader.result);
      //set this buffer -using es6 syntax
        this.setState({buffer});
    };
    
  onClick = async () => {
    try{
          this.setState({blockNumber:"waiting.."});
          this.setState({gasUsed:"waiting..."});
    //get Transaction Receipt in console on click
    //See: https://web3js.readthedocs.io/en/1.0/web3-eth.html#gettransactionreceipt
    await web3.eth.getTransactionReceipt(this.state.transactionHash, (err, txReceipt)=>{
            console.log(err,txReceipt);
            this.setState({txReceipt});
          }); //await for getTransactionReceipt
    await this.setState({blockNumber: this.state.txReceipt.blockNumber});
          await this.setState({gasUsed: this.state.txReceipt.gasUsed});    
        } //try
      catch(error){
          console.log(error);
        } //catch
  } //onClick
  onSubmit = async (event) => {
    event.preventDefault();
    //obtain contract address from storehash.js
    const ethAddress= await storehash.options.address;
    this.setState({ethAddress});
    const balance = await healthToken.methods.balanceOf(this.state.walletAddress).call();
    console.log(balance)
    if (balance >= 1000){
      this.setState({verified: true})
    }

    //save document to IPFS,return its hash#, and set hash# to state
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add 
    await ipfs.add(this.state.buffer, (err, ipfsHash) => {
        //console.log(err,ipfsHash);
        //setState by setting ipfsHash to ipfsHash[0].hash 
        this.setState({ ipfsHash:ipfsHash[0].hash });
     // call Ethereum contract method "sendHash" and .send IPFS hash to etheruem contract 
    //return the transaction hash from the ethereum contract
    //see, this https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send
      // if the user has the tokens, 


      if(this.state.verified)  {
        storehash.methods.sendHash(this.state.ipfsHash).send({
          from: this.state.walletAddress
        }, (error, transactionHash) => {
          //console.log(transactionHash);
          this.setState({transactionHash});
          //console.log(storehash.methods.getHash())
        }); //storehash 
      }
      }) //await ipfs.add
      //console.log("Locate")
      //console.log(storehash.methods.getHash())
      //console.log(this.state.hashList)
    }; //onSubmit


    // for any user who has metamask, send the ERC-20 tokens to the account.
    getToken = async () => {
      healthToken.methods.transfer(this.state.walletAddress,1000).send({
        // creator of the contract?
        from: ''
      },(error,tokenTransactionHash) =>{
        console.log('token transaction successfull with the tansaction hash: '+tokenTransactionHash);
      });

    }


render() {
      //const mypp = storehash.methods.getHash().call()
      //const mypp = this.ppTest()

      //Issue: pp returned in ppTest() is an array
      //However, when it is called here, it becomes a promise
      //This should be fixed
      //Y
      //console.log(this.ppTest()) 
      const updateItems = this.state.hashList.map((update) =>
      <ListGroup.Item key={update.id}>
      <Row>
        <Col xs={8} style={{ display: "flex"}}>
          <Container style={{ display: "flex", alignItems:"center",textOverflow: "clip" }}>{update}</Container>
        </Col>
        <Col >
            <ViewNews hash={update}/>
          </Col>
          <Col>
            <Button variant="outline-dark" >Report</Button>
          </Col>
      </Row>
  </ListGroup.Item>);
      
        return (
        <div className="App">
        <p className="App-header">Northwestern Covid-19 News-Sharing Platform</p>  
          <hr />
          <Row>
            <Col>
                <p>News update</p>
                <hr />
                <div className="list-wrapper">
                  <p>{updateItems}</p>
                </div>                     
                
            </Col>
            <Col>
            <Container>
              <Row>
        <Col><p>Link your Metamask account: {this.state.walletAddress}</p></Col>
                <Col><Button onClick = {this.getToken}> Get Token</Button></Col>
                
              </Row>
              <hr />

              <Form onSubmit={this.handleSubmit}>
                <textarea value={this.state.value} onChange={this.handleChange}/>
                <Button bsStyle="primary" type="submit"> Send it </Button>
              </Form>

              <hr/>
              <Form onSubmit={this.onSubmit}>
                <input type = "file" onChange = {this.captureFile}/>
                <Button bsStyle="primary" type="submit"> Send it </Button>
              </Form>
              <hr/>

          <Button onClick = {this.onClick}> Get Transaction Receipt </Button>
          <hr />
          <Table bordered responsive>
                <thead>
                  <tr>
                    <th>Tx Receipt Category</th>
                    <th>Values</th>
                  </tr>
                </thead>
               
                <tbody>
                  <tr>
                    <td>IPFS Hash # stored on Eth Contract</td>
                    <td>{this.state.ipfsHash}</td>
                  </tr>
                  <tr>
                    <td>Ethereum Contract Address</td>
                    <td>{this.state.ethAddress}</td>
                  </tr>
                  <tr>
                    <td>Tx Hash # </td>
                    <td>{this.state.transactionHash}</td>
                  </tr>
                  <tr>
                    <td>Block Number # </td>
                    <td>{this.state.blockNumber}</td>
                  </tr>
                  <tr>
                    <td>Gas Used</td>
                    <td>{this.state.gasUsed}</td>
                  </tr>
                
                </tbody>
            </Table>
        </Container>
            </Col>
          </Row>

        <p className="App-header">About</p>
          
          <hr />
     </div>
      );
    } //render
} //App
export default App;