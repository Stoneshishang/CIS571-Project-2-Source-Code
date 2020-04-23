//jshint esversion: 8
//jshint -W069
//jshint -W082
// Ayuan
const axios = require('axios');
const express = require("express");
const bodyParser = require("body-parser");
const jsonReader = require("json-read-and-parse-file");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

let Coordinationprotocol = jsonReader("wscp.json");

console.log(Coordinationprotocol);

//Every Time POST is triggered, add its state to this states array.
let states = [];

app.get('/', function(req, res) {

  res.sendFile(__dirname + '/index.html');

});

app.post('/', function(req, res) {

  selectedWS = req.body.WebServices;

  //Every time the Invoke button is clicked, push one selected Web Service in the array to keep state.
  states.push(selectedWS);

  let statesLength = states.length;
  let statesIndex = Number(statesLength - 1);

  console.log('*************************statesIndex******************************');
  console.log(statesIndex);

  let entranceVerificationNumber = Coordinationprotocol[0]['entrance'];

  //Starting of Conversation Handler

  let userUniqueID = Math.floor(Math.random() * (10000 - 1 + 1)) + 1;

  if (entranceVerificationNumber == selectedWS && statesIndex == 0) {

    let initialWS = entranceVerificationNumber;
    let initialName = req.body.name;

    let initialURL = `http://localhost:3000/cp/${initialWS}/Name/${initialName}`;

    console.log(initialURL);

    //Retreive info from localhosted APIs with Async(Promise) function
    //And return the API response to the Scope.
    //Source: https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call

    //Async call for invoking the API created at runtime
    async function getApiResponse() {
      try {

        let response = await axios.get(initialURL);

        console.log('***************response.data*******************');
        console.log(response.data);

        console.log('*****************req.body.name*****************');
        let nextName = req.body.name;
        console.log(nextName);

        return await axios.get(initialURL);

      } catch (error) {
        console.error(error);
      }
    }

    // Start an IIFE to use `await` at the top level
    //An Immediately Invoked Function Expressions (IIFE) is a function that is called directly after the function is loaded into the browser’s compiler.
    //The way to identify an IIFE is by locating the extra left and right parenthesis at the end of the function’s definition.
    (async function() {
      let apiResponseOutOfAsync = await getApiResponse();
      console.log('//////////////************** apiResponseOutOfAsync ***********////////////');
      //Now I can access the returned API result outside of Async promises .then()
      console.log(apiResponseOutOfAsync.data);

      let apiResult = apiResponseOutOfAsync.data;
      let responseFormatInitial = apiResponseOutOfAsync.data.charAt(0);

      console.log('||||||||||||||************************responseFormatInitial*******************||||||||');
      console.log(responseFormatInitial);

      res.render('wscp', {
        resultType: apiResult,
        webserviceList: states
      });

      nextAvailableWebServices = apiResult.slice(-1);
      console.log('<<<<<<<<*******************nextAvailableWebServices************>>>>>>>>>>>');
      console.log(nextAvailableWebServices);



    })();

  } else if (statesIndex > 0 && nextAvailableWebServices == selectedWS) {

    console.log(`******************************States Array *******************************
                                        ${states}`);


    let futureName = req.body.name;

    let dynamicApiURL = `http://localhost:3000/cp/${nextAvailableWebServices}/Name/${futureName}`;

    console.log(dynamicApiURL);

    async function futureApiResponse() {
      try {
        let response = await axios.get(dynamicApiURL);
        console.log('((((((((((((((***********************futureApiResponse*************))))))))))))))');
        console.log(response.data);
        let futureApiResult = response.data;

        res.render('wscp', {
          resultType: futureApiResult,
          webserviceList: states
        });
      } catch (error) {
        console.error(err);
      }
    }

    futureApiResponse();
  } else {
    //If user selected WS violate the CP.
    console.log('The selected Web Service can not be invoked at current state');
    let err = 'The selected Web Service can not be invoked at current state';
    let err1 = 'The WS selection violates the Coordination Protocol';
    res.render('wscp', {
      resultType: err,
      webserviceList: err1
    });
  }

});


//Creat an API Schema where I can dynamically change the parameters at run time and route the result according to the converstation handle
app.get('/cp/:webserviceNumber/Name/:NameString', (req, res) => {

  let nameInput = req.params.NameString;
  let nameInitial = nameInput.charAt(0);
  let today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();
  let currentDay = today.getDate();
  let currentHour = today.getHours();
  let currentMin = today.getMinutes();

  let selectedWS = Number(req.params.webserviceNumber);

  if (/^[A-M]/.test(nameInitial)) {

    nextWS = Coordinationprotocol[selectedWS][selectedWS]['J'];

    let jsonResult = `JSON reponse is
    {name: ${nameInput}, InvocationDate: ${currentYear}/${currentMonth}/${currentDay}, InvocationTime: ${currentHour}:${currentMin}}
                The current selected WebService is ${selectedWS},
                The next Available Web Service is ${nextWS}`;

    res.send(jsonResult);
  } else {

    nextWS = Coordinationprotocol[selectedWS][selectedWS]['X'];

    let xmlResult = `XML reponse is
    <name>${nameInput}</name> <InvocationDate>${currentYear}/${currentMonth}/${currentDay}</InvocationDate> <InvocationTime>${currentHour}:${currentMin}</InvocationTime>
                The current selected WebService is ${selectedWS},
                The next Available Web Service is ${nextWS}`;

    res.send(xmlResult);
  }
});


app.listen(process.env.PORT || 3000, function() {
  console.log("Server is running on port 3000");
});
