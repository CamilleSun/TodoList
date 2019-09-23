const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname+"/date.js");

var app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://username:password@cluster0-wruag.mongodb.net/todolistDB',{useNewUrlParser:true});
const itemsSchema = new mongoose.Schema({name: String});
const Item = mongoose.model("Item",itemsSchema);
const item1 = new Item({name:"Welcome to your todolist!"});
const item2 = new Item({name:"Hit the + button to add a new item."});
const item3 = new Item({name:"<-- Hit this to delete an item."});
const item4 = new Item({name:"Visit /'YourListName' to create your own todolist!"});
const defaultItems = [item1,item2,item3,item4];

const listSchema = new mongoose.Schema({
  name: String,
  items:[itemsSchema]
});
const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {
  let day = date.getDate();

  Item.find({},function(err,foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems,function(err){
        if(err){console.log(err)}
      });
      res.redirect("/");
    }
    else{res.render("list",{listTitle: day,listItems: foundItems});}
  });
})

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        const list = new List({name:customListName,items:defaultItems});
        list.save();
        res.redirect("/"+customListName);
      }
      else res.render("list",{listTitle: customListName,listItems: foundList.items});
    }
  });
});

app.post("/",function(req,res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({name:itemName});
  if(listName===date.getDate()){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

app.post("/delete",function(req,res){
  const checkedBoxId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName===date.getDate()){
    Item.findByIdAndRemove(checkedBoxId,function(err){
      if(err){console.log(err)}
    })
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedBoxId}}},function(err,foundList){
        if(err) console.log(err);
      }
    );
    res.redirect("/"+listName);
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
   console.log("Server has started successfully");
 })
