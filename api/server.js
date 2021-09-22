const stripe = require("stripe")(
  "sk_test_51HdM1jCnYymDJHKDiIDsNRjiW1Eav8MEivuOovdtGCr14q3xuvElM4mEhHfuIZ7gYJ4BICWTF8nkabjjwal8mITx00PnuNxE60"
);
const http = require("http");
const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.static("public"));
const server = http.createServer(app);
const bodyParser = require("body-parser");
app.use(cors());
// create application/json parser
bodyParser.json();
// create application/x-www-form-urlencoded parser
bodyParser.urlencoded({ extended: false });

app.use(bodyParser());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
const PORT = 4000;
const DOMAIN = `http://localhost:${PORT}`;
const FRONT = "https://formablocs.fr";

app.get("/", function (req, res) {
  res.send("Hello World!");
});

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.post("/create-checkout-session", cors(corsOptions), async (req, res) => {
  const { articles } = req.body;
  // Items transformed to send into session stripe.
  const transformedItems = articles.map((item) => {
    return {
      quantity: 1,
      price_data: {
        currency: "EUR",
        unit_amount: item.price * 100,
        product_data: {
          name: item.title,
        },
      },
    };
  });
  console.log(transformedItems);

  const session = await stripe.checkout.sessions.create({
    line_items: transformedItems,
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${FRONT}/success.html`,
    cancel_url: `${FRONT}/formation.html`,
  });

  res.redirect(303, session.url);
});

const fulfillOrder = (session) => {
  // TODO: fill me in
  console.log("Fulfilling order", session);
};

app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  (request, response) => {
    const payload = request.body;
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Fulfill the purchase...
      fulfillOrder(session);
    }

    response.status(200);
  }
);

app.listen(4242, () => console.log("Running on port 4242"));

server.listen(PORT, () => {
  console.log(`listening on ${DOMAIN}`);
});
