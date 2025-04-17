// ********************** Initialize server **********************************

const server = require("../index"); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require("chai"); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;


describe("Server!", () => {
    // Sample test case given to test / endpoint.
    it("Returns the default welcome message", (done) => {
      chai
        .request(server)
        .get("/welcome")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.equals("success");
          assert.strictEqual(res.body.message, "Welcome!");
          done();
        });
    });
  });

// ********************** DEFAULT WELCOME TESTCASE ****************************
describe("Testing Add User API", () => {
    it("positive : /register with valid username and password", (done) => {
      chai
        .request(server)
        .post("/register")
        .set('Content-Type', 'application/json')
        .send({ username: "validUser", password: "ValidPass123" })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.redirectTo(/\/login$/);
          done();
        });
    });
  
    it("negative : /register with missing username", (done) => {
      chai
        .request(server)
        .post("/register")
        .set('Content-Type', 'application/json')
        .send({ password: "ValidPass123", username: null })  // Explicitly setting username to null
        .end((err, res) => {
          //expect(res).to.have.status(400);
          expect(res).to.redirectTo(/\/register$/);
          done();
        });
    });
  
    it("negative : /register with missing password", (done) => {
      chai
        .request(server)
        .post("/register")
        .set('Content-Type', 'application/json')
        .send({ username: "validUser", password: null })  // Explicitly setting password to null
        .end((err, res) => {
          // expect(res).to.have.status(302);
          expect(res).to.redirectTo(/\/register$/);
          done();
        });
    });
  });

// ********************************************************************************

describe("Testing login API", () => {
    it("positive : /login with valid username and password redirects to discover page", (done) => {
        chai
            .request(server)
            .post("/login")
            .set('Content-Type', 'application/json')
            .send({username: "validUser", password: "ValidPass123" })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res).to.redirectTo(/\/discover$/);
                done();
            })
        });
});
