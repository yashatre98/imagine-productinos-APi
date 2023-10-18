var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev')); // writes summaries of requests to the console
app.use(express.json()); // checks if the request body is formatted in JSON and converts it from a string to an object if so
app.use(express.urlencoded({ extended: false })); // checks if the request body is formatted as URL-encoded form data and converts it from a string to an object if so
app.use(cookieParser()); // checks for the presence of a cookie string in the headers and converts it into an easier to use data structure

// home page
app.get('/', (req, res) => {
    res.send('Welcome to Imagine Productions!')
})

// preloaded with some data so we dont need to populate again and again
const formulas = [{"id":0,"inputs":[{"Sugar":3},{"Milk":2},{"Flour":4}],"outputs":[{"Cookies":12}]},{"id":1,"inputs":[{"Ore":100},{"Coal":50},{"Steam":200}],"outputs":[{"Steal bar":25}]}
,{"id":2,"inputs":[{"Wood":100},{"Glue":75},{"tools":10}],"outputs":[{"table":60}]},{"id":3,"inputs":[{"Herbs":20},{"Water":75},{"Container":60}],"outputs":[{"Questionable potion":60}]},
{"id":4,"inputs":[{"cups of coffee":20},{"laptop":1},{"lines of code":60}],"outputs":[{"caffeine-induced typo":60}]},{"id":5,"inputs":[{"pillows":2},{"cozy blanket":1},{"Pending work":60}],
"outputs":[{"induced Sleep":10000000}]},{"id":6,"inputs":[{"red pill":1},{"blue pill":1},{"decision":1}],"outputs":[{"A surreal virtual reality adventure, mastery of kung fu, and a wardrobe upgrade with only black leather":1}]},
{"id":7,"inputs":[{"chance encounter":1},{"witty remarks":1},{"shared playlists":1}],"outputs":[{"romance is expected":1}]},{"id":8,"inputs":[{"algorithmic attraction":2},{"encrypted love letters":3},{"virtual kisses":100}],
"outputs":[{"Complex equations for love":1}]},{"id":9,"inputs":[{"toolbox":1},{"YouTube tutorials":3000},{"misaligned screws":2}],"outputs":[{"Destroy It Yourself":1}]},{"id":10,"inputs":[{"empty pantry":1},{"cravings":1}],"outputs":[{"impulse buys":10}]},
{"id":11,"inputs":[{"popcorn bowl":1},{"movie choices":2}],"outputs":[{"heated debates":1}]}  ];

const plans=[{"id":0,"plan_body":{"formulas":[0,1,2,3]}},{"id":1,"plan_body":{"formulas":[0,1,2,3]}},{"id":2,"plan_body":{"formulas":[1,3,6]}},{"id":3,"plan_body":{"formulas":[1,9,8]}},
{"id":4,"plan_body":{"formulas":[1,8,11]}},{"id":5,"plan_body":{"formulas":[2,6,8]}},{"id":6,"plan_body":{"formulas":[3,10]}},{"id":7,"plan_body":{"formulas":[1,5,8,9]}}];

// 1. Add a new formula
app.post('/formulas', (req, res) => {
  // POST most closely corresponds to adding an element to a collection
  // console.log(req.body)
  const inputs=req.body.inputs
  const outputs=req.body.outputs
  if(inputs.length===0 || outputs.length===0){
    return res.status(400).send("Bad input for formula")
  }
  const newFormula = {
    id: formulas.length,
    inputs,
    outputs,
  };
  formulas.push(newFormula)
  res.status(201).send("Formula Created")
})

// 2. See the inputs and outputs of a specific formula. (formatted in a sentence)
app.get('/formulas/:id', (req, res) => {
  const formulaId = parseInt(req.params.id);
  if(formulaId<0){
    return res.status(400).send("The formula id is invalid")
  }
  const formula = formulas.find((f) => f.id === formulaId);

  if(formula){
    const input = formula.inputs.map((item) => {
    const key = Object.keys(item)[0]; 
    const value = item[key];
    return `${value} ${key}`;
    });
    const output = formula.outputs.map((item) => {
    const key = Object.keys(item)[0]; 
    const value = item[key];
    return `${value} ${key}`;
    });
    const inputString = input.join(', ');
    const outputString = output.join(', ');
    return res.status(200).send(`when you have ${inputString}, you can make ${outputString}.`).json(formula);
  }
  else{
    return res.status(404).send('Formula not found' );
  }
  
});

//3. List which plans contain a specific formula.
app.get('/formulas/:id/plans',(req,res)=>{
  const formulaID= parseInt(req.params.id)
  if(formulaID<0){
    return res.status(400).send("The formula id is invalid")
  }
  const plans_with=[]
  // const plans_formula=
  if(formulaID>formulas.length || formulaID<0){
    return res.status(404).send("Formula does not exist")
  }

  Object.values(plans).forEach(plan=>{
    //console.log(plan.plan_body.formulas, plan.id)
    const plan_form=plan.plan_body.formulas
    //console.log(plan_form.includes(formulaID))
      if(plan_form.includes(formulaID)){
        plans_with.push(plan.id)
      }
      //console.log("Hello",plans_with)
      
  })
  res.status(200).send(plans_with)
})

//4. Add a new plan
app.post('/plans', (req, res) => {
  const plan_body = req.body

  const newPlan={
    id: plans.length,
    plan_body,
  };
  if(plan_body.formulas.length===0){
    return res.status(400).send("the input was not correct")
  }
  plans.push(newPlan);
  res.status(201).json(newPlan);
});

//5. Append one or more formulas to a plan, also check if the formula is already there, and then just moves it to the append position.
app.post('/plans/:id/formulas', (req, res) => {

  const { id } = req.params;
  if(id<0 || id>plans.length ){
    return res.status(400).send("The plan id is invalid")
  }
  const plan = plans[id];

  if (!plan) {
    return res.status(404).send('Plan not found');
  }

  const newFormulas = req.body.formulas;
  const planFormulas = plan.plan_body.formulas;

  newFormulas.forEach(newFormula => {

    const index = planFormulas.indexOf(newFormula);

    if (index !== -1) {
      // Exists in plan, move to end
      const removed = planFormulas.splice(index, 1);
      planFormulas.push(removed[0]);
    } else {
       // Doesn't exist, append 

       if(parseInt(newFormula)>=formulas.length || parseInt(newFormula)<0){ //check if the formula exists or no
         return res.status(404).send("Formula not found");
       }
       else{
      planFormulas.push(newFormula);
       }
    }

  });

  res.status(201).send('Formulas appended to plan');
  
});

//6. Replace formula in a plan with another.
app.put('/plans/:id/replace',(req,res)=>{
  const planID= parseInt(req.params.id)
  const formulaID_to_replace= parseInt(req.body.replace)
  const formulaID_replace_with=parseInt(req.body.replace_with)
  if(formulaID_replace_with<0 || formulaID_to_replace<0){
    res.status(400).send("Invalid input")
  }
  //console.log("Hello",formulaID_replace_with, formulaID_to_replace)
  const plan=plans[planID]
    const plan_formulas=plan.plan_body.formulas
    const inde=plan_formulas.indexOf(formulaID_to_replace)
    
    if(formulaID_replace_with>formulas.length || formulaID_replace_with<0 || formulaID_to_replace>formulas.length || formulaID_to_replace<0){
      return res.status(404).send("please check the the formulas given either one or both do not exist.")
    }
    if(inde!==-1){
      plan_formulas[inde]=formulaID_replace_with
      return res.status(200).json(plans)
    }
    else{
     return res.status(404).send('formula does not exist in this plan ')
    }
    
})

//7.list all formulas in a plan. ( See details of a specific plan, )
app.get('/plans/:id/formulas', (req, res) => {
  // we can send objects or arrays and Express will automatically convert them to JSON strings
  const planId = parseInt(req.params.id);
  if(planId<0 || planId>plans.length ){
    return res.status(400).send("The plan id is invalid")
  }
    const plan = plans.find((f) => f.id === planId);
    if(plan){
      const formula_indexs=plan.plan_body.formulas;
      const formula_values= formula_indexs.map(index=>{return formulas[index];});
      res.status(200).json(formula_values)
      
    }

    else{
      res.status(404).json({ error: 'Plan not found' });
    }
});

//8. Delete a spefic plan with id
app.delete('/plans/:id',(req,res)=>{
  const planID= req.params.id
  if(planID<0 || planID>plans.length ){
    return res.status(400).send("The plan id is invalid")
  }
  if(!plans[planID]){
    res.status(404).send('Plan not found');
  }
  else{
    plans.splice(planID,1);
    res.status(200).send('Plan deleted');
  }
});

// extra functions
// list all Formulas
app.get('/formulas', (req, res) => {
    // we can send objects or arrays and Express will automatically convert them to JSON strings
    res.send(formulas)
});

// Delete a specific formula with id
app.delete('/formulas/:id',(req,res)=>{
    const formulaID= req.params.id
    if(!formulas[formulaID]){
      res.status(404).send('Formula not found');
    }
    else{
      formulas.splice(formulaID,1);
      res.status(200).send('Formula deleted');
    }
});

// List all plans
app.get('/plans', (req, res) => {
  res.send(plans)
})




module.exports = app;

