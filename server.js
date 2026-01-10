import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

/* =====================================================
   🔐 CORS – CONFIGURAZIONE DEFINITIVA (www + non-www)
===================================================== */

const allowedOrigins = [
  'https://pasticceriadellanonnaincammino.it',
  'https://www.pasticceriadellanonnaincammino.it'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permette richieste senza origin (health check, curl, ecc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// 🔥 PRE-FLIGHT OPTIONS (FONDAMENTALE)
app.options('*', cors());

/* =====================================================
   📦 BODY PARSER
===================================================== */
app.use(express.json());

/* =====================================================
   💳 STRIPE
===================================================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

/* =====================================================
   🔎 HEALTH CHECK
===================================================== */
app.get('/', (req, res) => {
  res.send('✅ Stripe backend attivo');
});

/* =====================================================
   💳 CREATE STRIPE CHECKOUT SESSION
===================================================== */
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

      success_url:
        'https://pasticceriadellanonnaincammino.it/grazie.html?stripe=ok',
      cancel_url:
        'https://pasticceriadellanonnaincammino.it/pagamento-annullato.html'
    });

    res.json({ sessionId: session.id });

  } catch (err) {
    console.error('❌ Errore Stripe:', err);
    res.status(500).json({ error: 'Errore Stripe' });
  }
});

/* =====================================================
   ▶️ START SERVER (RENDER)
===================================================== */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Stripe server avviato sulla porta ${PORT}`);
});
