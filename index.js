const express = require('express');
const app = express();
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion} = require('mongodb');
var ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const port = process.env.PORT || 5000

// middleware
app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tlqgi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   console.log('connect the databse mongodb............');
//   // perform actions on the collection object
//   client.close();
// });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: "unauthorized access"})
    }
    const token =  authHeader.split(" ")[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if(error){
            return res.status(403).send({message: 'Forbidden access'})
        }
        else{
            console.log('decoded', decoded);
            req.decoded = decoded;
            next();
        }
    }) 
   
}
 

async function run(){

    try{
        await client.connect();
        const serviceCollection = client.db('geniusCar2').collection('services');
        const orderCollection = client.db('geniusCar2').collection('order');


        // AUTH
        app.post('/login', async(req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "1d"
            });
            res.send({accessToken});
        })


        // GET API
        app.get('/service', async(req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        });
        // GET API by id
        app.get('/service/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await serviceCollection.findOne(query);
            res.send(result)
        })

        // POST API
        app.post('/service', async(req, res) => {
            const query = req.body;
            console.log(query)
            const result = await serviceCollection.insertOne(query);
            res.send(result)
        });
        // DELETE API
        app.delete('/service/:id', async(req,res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        });


        // ORDER Collection API

        app.get('/order', verifyJWT, async(req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req?.query.email; 
            if(email === decodedEmail){
                const query = {email: email};
                const cursor = orderCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }else{
                res.status(403).send({message: 'Forbidden Access'})
            }
        })

        app.post('/order', async(req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })

    }
    finally{
        // await client.close()
    }

}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('Genius car mechanic Node server.....');
})


app.listen(port, () => {
    console.log('Connect the node server...', port)
})
