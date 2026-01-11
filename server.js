import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

/* =====================================================
   🔐 CORS – RENDER SAFE
===================================================== */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/* =====================================================
   📦 BODY PARSER
===================================================== */
app.use(express.json());

/* =====================================================
   💳 STRIPE (API 2025)
===================================================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


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

      line_items: [
        {
          price_data: {
            currency: valuta.toLowerCase(),
            unit_amount: Math.round(totale * 100),
            product_data: {
              name: 'Ordine Pasticceria della Nonna',
              description: riepilogo
                ? riepilogo.slice(0, 500)
                : 'Ordine online'
            }
          },
          quantity: 1
        }
      ],

      success_url:
        'https://pasticceriadellanonnaincammino.it/grazie.html?stripe=ok',
      cancel_url:
        'https://pasticceriadellanonnaincammino.it/pagamento-annullato.html'
    });

    res.json({ sessionId: session.id });

  } catch (err) {
    console.error('❌ STRIPE ERROR TYPE:', err.type);
    console.error('❌ STRIPE MESSAGE:', err.message);

    if (err.raw) {
      console.error('🔴 STRIPE RAW:', err.raw);
    }

    res.status(500).json({
      error: err.message,
      type: err.type,
      stripe: err.raw?.message,
      code: err.raw?.code
    });
  }
});

/* =====================================================
   ▶️ START SERVER (RENDER)
===================================================== */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Stripe server avviato sulla porta ${PORT}`);
});

