const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();
const fs = require("fs");
const crypto = require("crypto");
const { types } = require("util");
const { findClosestNumbers } = require("./utils");
const { stringify } = require("querystring");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./pokemon/pokemon"); 
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // Lấy phần mở rộng của tệp

    cb(null, req.body.id + ext); // Đặt tên tệp
  },
});

const upload = multer({ storage: storage });

/**
 * params: /
 * description: get all pokemons
 * query:
 * method: get
 */

router.get("/", (req, res, next) => {
  //input validation

  const allowedFilter = ["name", "type", "page", "limit"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    console.log("query", req.query);
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    //processing logic
    //Number of items skip for selection
    let offset = limit * (page - 1);

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    const type = req.query["type"] || "";
    const name = req.query["name"] || "";
    console.log("type name", type);
    if (isNaN(name) || name === "") {
      result = pokemons.filter((pokemon) => {
        const hasType = type
          ? pokemon.types.some((t) => t.toLowerCase() === type.toLowerCase())
          : true;
        const hasName = name
          ? pokemon.name.toLowerCase() === name.toLowerCase()
          : true;
        return hasType && hasName;
      });
    } else {
      console.log("seach by id");
      result = pokemons.filter((pokemon) => pokemon.id === parseInt(name));
    }

    //then select number of result by offset
    result = result.slice(offset, offset + limit);
    //send response
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});


router.get("/:id", (req, res, next) => {
  try {
    let id = parseInt(req.params.id);
    console.log("id fsdf", id);
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;
    const allId = pokemons.map((pokemon) => pokemon.id);
    const { previous, next } = findClosestNumbers(allId, id);
    console.log("pre", previous);

    const pokemon = pokemons.find((p) => p.id === id);
    const previousPokemon = pokemons.find((p) => p.id === previous);
    const nextPokemon = pokemons.find((p) => p.id === next);

    //send response
    res.status(200).send({ previousPokemon, pokemon, nextPokemon });
  } catch (error) {
    next(error);
  }
});


router.get("/allid/all", (req, res, next) => {
  try {
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    const allId = pokemons.map((pokemon) => pokemon.id);
    const allName = pokemons.map((pokemon) => pokemon.name);
    //send response
    res.status(200).send({ allId, allName });
  } catch (error) {
    next(error);
  }
});

router.post("/", upload.single("image"), (req, res, next) => {
  //post input validation
  const { name, id, type1, type2, extFile } = req.body;
  console.log("success", { name, id, type1, type2, extFile });
  try {
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;
    const allId = pokemons.map((pokemon) => pokemon.id);
    const allName = pokemons.map((pokemon) => pokemon.name);
    const allType = [
      "normal",
      "fire",
      "water",
      "electric",
      "grass",
      "ice",
      "fighting",
      "poison",
      "ground",
      "flying",
      "psychic",
      "bug",
      "rock",
      "ghost",
      "dragon",
      "dark",
      "steel",
      "fairy",
    ];

    if (!id || !name || !(type1 || type2)) {
      const exception = new Error(`Request missing some data {id,name,type}`);
      console.log(`Request missing some data {id,name,type}`);
      exception.statusCode = 404;
      throw exception;
    }

    if (allId.includes(parseInt(id))) {
      const exception = new Error(`id = ${id} already exists`);
      console.log(`id = ${id} already exists`);
      exception.statusCode = 404;
      throw exception;
    }

    if (allName.includes(name.toLowerCase())) {
      const exception = new Error(`name = ${name} already exists`);
      console.log(`name = ${name} already exists`);
      exception.statusCode = 404;
      throw exception;
    }
    if (
      (!type1 && !allType.includes(type2.toLowerCase())) ||
      (!type2 && !allType.includes(type1.toLowerCase()))
    ) {
      const exception = new Error(`Pokémon's type is invalid`);
      console.log(`Pokémon's type is invalid`);
      exception.statusCode = 404;
      throw exception;
    }
    const url = `pokemon/${id}.${extFile}`;
    console.log("den day url");
    let types = [];

    if (type1 && type1 !== "undefined") types.push(type1);
    if (type2 && type2 !== "undefined") types.push(type2);

    //post processing
    const newPokemon = {
      id: parseInt(id),
      name,
      url,
      types,
    };

    //Add new Pokemon to Pokemons JS object
    pokemons.push(newPokemon);
    //Add new book to db JS object
    db.pokemons = pokemons;
    //db JSobject to JSON string
    db = JSON.stringify(db);
    //write and save to db.json

    fs.writeFileSync("pokemons.json", db);

    //post send response

    res.status(200).send({ newPokemon });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
