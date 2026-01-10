import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'https://pasticceriadellanonnaincammino.it',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.options('*', cors()); // ⭐ FONDAMENTALE

app.use(express.json());


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});


// 🔎 Health check (utile per test)
app.get('/', (req, res) => {
  res.send('✅ Stripe backend attivo');
});

// 💳 Crea sessione Stripe Checkout
app.post('/create-stripe-session', async (req, res) => {
  try {
    const { totale, valuta = 'EUR', riepilogo } = req.body;

    if (!totale || totale <= 0) {
      return res.status(400).json({ error: 'Totale non valido' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',

      payment_method_types: ['card'],

      line_items: [{
        price_data: {
          currency: valuta.toLowerCase(),
          product_data: {
            name: 'Ordine Pasticceria della Nonna',
            description: riepilogo
              ? riepilogo.slice(0, 500)
              : 'Ordine online'
          },
          unit_amount: Math.round(totale * 100)
        },
        quantity: 1
      }],

      success_url: 'https://pasticceriadellanonnaincammino.it/grazie.html?stripe=ok',
      cancel_url: 'https://pasticceriadellanonnaincammino.it/pagamento-annullato.html'
    });

    res.json({ sessionId: session.id });

  } catch (err) {
    console.error('❌ Errore Stripe:', err.message);
    res.status(500).json({ error: 'Errore Stripe' });
  }
});

// ▶️ Avvio server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Stripe server avviato sulla porta ${PORT}`);

});
