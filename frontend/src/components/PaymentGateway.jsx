import { useState } from 'react';

const METHODS = [
  {
    id: 'bkash',
    label: 'bKash',
    color: '#E2136E',
    bg: 'rgba(226,19,110,0.08)',
    border: 'rgba(226,19,110,0.35)',
    logo: '💗',
    desc: 'Mobile Banking',
    placeholder: '01XXXXXXXXX',
    pinLabel: 'bKash PIN',
  },
  {
    id: 'nagad',
    label: 'Nagad',
    color: '#F26522',
    bg: 'rgba(242,101,34,0.08)',
    border: 'rgba(242,101,34,0.35)',
    logo: '🟠',
    desc: 'Digital Wallet',
    placeholder: '01XXXXXXXXX',
    pinLabel: 'Nagad PIN',
  },
  {
    id: 'rocket',
    label: 'Rocket',
    color: '#8B2FC9',
    bg: 'rgba(139,47,201,0.08)',
    border: 'rgba(139,47,201,0.35)',
    logo: '🚀',
    desc: 'DBBL Mobile',
    placeholder: '017XXXXXXXX',
    pinLabel: 'Rocket PIN',
  },
  {
    id: 'card',
    label: 'Card',
    color: '#00D4FF',
    bg: 'rgba(0,212,255,0.08)',
    border: 'rgba(0,212,255,0.35)',
    logo: '💳',
    desc: 'Visa / Mastercard',
    placeholder: null,
    pinLabel: null,
  },
];

// Determine text color on colored button backgrounds
function btnTextColor(color) {
  const dark = ['#E2136E', '#8B2FC9', '#F26522'];
  return dark.includes(color) ? '#fff' : '#000';
}

export default function PaymentGateway({ amount, itemDescription, onSuccess, onCancel }) {
  const isFree = Number(amount) === 0;

  const [method, setMethod]             = useState(null);
  const [step, setStep]                 = useState(isFree ? 'free_confirm' : 'method');
  const [phone, setPhone]               = useState('');
  const [pin, setPin]                   = useState('');
  const [cardNumber, setCardNumber]     = useState('');
  const [cardName, setCardName]         = useState('');
  const [cardExpiry, setCardExpiry]     = useState('');
  const [cardCvv, setCardCvv]           = useState('');
  const [otp, setOtp]                   = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [txId, setTxId]                 = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  const selectedMethod = METHODS.find(m => m.id === method);

  const fmtAmount = (n) =>
    Number(n) === 0 ? 'FREE' : '৳' + Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 });

  const randomOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
  const randomTx  = (prefix) =>
    prefix.toUpperCase() + Date.now().toString().slice(-8) +
    Math.random().toString(36).slice(2, 6).toUpperCase();

  const handleMethodSelect = (id) => {
    setMethod(id);
    setError('');
    setPhone('');
    setPin('');
    setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCvv('');
    setStep('details');
  };

  const handleDetailsNext = () => {
    setError('');
    if (method === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16)
        return setError('Enter a valid 16-digit card number.');
      if (!cardName)
        return setError('Enter the name on card.');
      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry))
        return setError('Enter expiry in MM/YY format.');
      if (!cardCvv || cardCvv.length < 3)
        return setError('Enter a valid CVV.');
    } else {
      if (!phone || phone.length < 11)
        return setError(`Enter your ${selectedMethod.label} number.`);
      if (!pin || pin.length < 4)
        return setError(`Enter your ${selectedMethod.label} PIN.`);
    }
    const generated = randomOtp();
    setGeneratedOtp(generated);
    console.log(`[GaanBajna Payment] OTP for ${selectedMethod.label}: ${generated}`);
    setStep('otp');
  };

  const handleOtpVerify = () => {
    setError('');
    if (!otp) return setError('Enter the OTP sent to your number.');
    if (otp !== generatedOtp) return setError('Incorrect OTP. Please try again.');
    setLoading(true);
    setStep('processing');
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success simulation
      if (success) {
        const tx = randomTx(method);
        setTxId(tx);
        setStep('success');
        onSuccess && onSuccess(tx);
      } else {
        setStep('failed');
      }
      setLoading(false);
    }, 2500);
  };

  const handleFreeConfirm = () => {
    setStep('processing');
    setTimeout(() => {
      const tx = randomTx('FREE');
      setTxId(tx);
      setStep('success');
      onSuccess && onSuccess(tx);
    }, 1500);
  };

  const handleCardNumber = (v) => {
    let clean = v.replace(/\D/g, '').slice(0, 16);
    clean = clean.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(clean);
  };
  const handleCardExpiry = (v) => {
    let clean = v.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 2) clean = clean.slice(0, 2) + '/' + clean.slice(2);
    setCardExpiry(clean);
  };
  const handleCardCvv = (v) => setCardCvv(v.replace(/\D/g, '').slice(0, 4));

  // ── Shared styles ──────────────────────────────────────────────────────────
  const overlay = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  };
  const modal = {
    background: '#0d0d0d', borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.08)',
    width: '100%', maxWidth: '420px',
    padding: '28px 24px',
    fontFamily: 'var(--text-mono, monospace)',
    position: 'relative',
    maxHeight: '90vh', overflowY: 'auto',
  };
  const labelStyle = {
    fontSize: '10px', letterSpacing: '0.15em', color: '#888',
    textTransform: 'uppercase', marginBottom: '6px', display: 'block',
  };
  const inputStyle = {
    width: '100%', background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', color: '#fff', padding: '12px 14px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'var(--text-mono, monospace)',
    transition: 'border-color 0.2s',
  };
  const btnPrimary = (color) => ({
    width: '100%', padding: '14px', borderRadius: '10px',
    background: color, color: btnTextColor(color),
    border: 'none', cursor: 'pointer', fontSize: '13px',
    fontFamily: 'var(--text-mono, monospace)', letterSpacing: '0.1em',
    fontWeight: 'bold', marginTop: '16px', transition: 'opacity 0.15s',
  });
  const btnGhost = {
    background: 'none', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px', color: '#888', cursor: 'pointer',
    padding: '10px 20px', fontSize: '11px',
    fontFamily: 'var(--text-mono, monospace)', letterSpacing: '0.1em',
  };

  const AmountBar = () => (
    <div style={{
      background: '#111', borderRadius: '10px', padding: '14px 16px',
      marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div>
        <div style={{ fontSize: '10px', color: '#666', letterSpacing: '0.15em' }}>PAYING FOR</div>
        <div style={{ fontSize: '12px', color: '#ccc', marginTop: '3px', maxWidth: '240px' }}>{itemDescription}</div>
      </div>
      <div style={{
        fontSize: isFree ? '18px' : '22px', fontWeight: 'bold',
        color: isFree ? '#00BFA6' : '#fff', whiteSpace: 'nowrap', marginLeft: '12px',
      }}>
        {fmtAmount(amount)}
      </div>
    </div>
  );

  // ── FREE TICKET CONFIRMATION ───────────────────────────────────────────────
  if (step === 'free_confirm') return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onCancel} style={{ ...btnGhost, position: 'absolute', top: '16px', right: '16px', padding: '6px 12px' }}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '52px', marginBottom: '12px' }}>🎟️</div>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '0.2em', marginBottom: '6px' }}>● FREE RESERVATION</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>Confirm Your Ticket</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>No payment required for this event</div>
        </div>

        <AmountBar />

        <div style={{ background: 'rgba(0,191,166,0.06)', border: '1px solid rgba(0,191,166,0.2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '8px', fontSize: '12px', color: '#00BFA6', lineHeight: '1.7' }}>
          ✅ Your seat will be reserved immediately<br />
          ✅ Show your ticket QR at the venue entrance<br />
          ✅ A confirmation will be sent to your account
        </div>

        <button style={btnPrimary('#00BFA6')} onClick={handleFreeConfirm}>
          🎉 CONFIRM FREE TICKET
        </button>
        <button style={{ ...btnGhost, width: '100%', marginTop: '10px' }} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );

  // ── METHOD SELECTION ───────────────────────────────────────────────────────
  if (step === 'method') return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onCancel} style={{ ...btnGhost, position: 'absolute', top: '16px', right: '16px', padding: '6px 12px' }}>✕</button>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '0.2em' }}>● SECURE PAYMENT</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '6px' }}>Choose Payment Method</div>
        </div>

        <AmountBar />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {METHODS.map(m => (
            <div key={m.id} onClick={() => handleMethodSelect(m.id)}
              style={{
                background: m.bg, border: `1px solid ${m.border}`,
                borderRadius: '12px', padding: '16px 12px', cursor: 'pointer',
                textAlign: 'center', transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${m.border}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{m.logo}</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: m.color }}>{m.label}</div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{m.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#444', letterSpacing: '0.1em' }}>
          🔒 SSL ENCRYPTED · POWERED BY GAANBAJNA PAY
        </div>
      </div>
    </div>
  );

  // ── PAYMENT DETAILS ────────────────────────────────────────────────────────
  if (step === 'details') return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={() => setStep('method')} style={{ ...btnGhost, position: 'absolute', top: '16px', left: '20px', padding: '6px 12px' }}>← Back</button>
        <button onClick={onCancel}               style={{ ...btnGhost, position: 'absolute', top: '16px', right: '16px', padding: '6px 12px' }}>✕</button>

        <div style={{ marginBottom: '20px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>{selectedMethod.logo}</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: selectedMethod.color }}>{selectedMethod.label}</span>
        </div>

        <AmountBar />

        {error && (
          <div style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#ff6b6b', fontSize: '12px', marginBottom: '14px' }}>
            ⚠️ {error}
          </div>
        )}

        {method === 'card' ? (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Card Number</label>
              <input style={inputStyle} placeholder="0000 0000 0000 0000"
                value={cardNumber} onChange={e => handleCardNumber(e.target.value)} maxLength={19} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Name on Card</label>
              <input style={inputStyle} placeholder="FULL NAME"
                value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Expiry Date</label>
                <input style={inputStyle} placeholder="MM/YY"
                  value={cardExpiry} onChange={e => handleCardExpiry(e.target.value)} maxLength={5} />
              </div>
              <div>
                <label style={labelStyle}>CVV</label>
                <input style={{ ...inputStyle, letterSpacing: '0.3em' }} placeholder="•••" type="password"
                  value={cardCvv} onChange={e => handleCardCvv(e.target.value)} maxLength={4} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['VISA', 'MASTERCARD', 'AMEX'].map(c => (
                <span key={c} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: '#1a1a1a', color: '#555', border: '1px solid #333' }}>{c}</span>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>{selectedMethod.label} Account Number</label>
              <input style={inputStyle} placeholder={selectedMethod.placeholder}
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                type="tel" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>{selectedMethod.pinLabel}</label>
              <input style={{ ...inputStyle, letterSpacing: '0.4em' }} placeholder="• • • • • •"
                type="password" value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
            <div style={{ background: '#111', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#555', lineHeight: '1.7', border: '1px solid rgba(255,255,255,0.04)' }}>
              ℹ️ A 6-digit OTP will be sent to <span style={{ color: selectedMethod.color }}>{phone || selectedMethod.placeholder}</span> to confirm.
            </div>
          </>
        )}

        <button style={btnPrimary(selectedMethod.color)} onClick={handleDetailsNext}>
          {method === 'card' ? '🔒 PROCEED TO VERIFY' : `📱 SEND OTP TO ${phone || selectedMethod.placeholder}`}
        </button>
      </div>
    </div>
  );

  // ── OTP VERIFICATION ───────────────────────────────────────────────────────
  if (step === 'otp') return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={() => setStep('details')} style={{ ...btnGhost, position: 'absolute', top: '16px', left: '20px', padding: '6px 12px' }}>← Back</button>
        <button onClick={onCancel}                 style={{ ...btnGhost, position: 'absolute', top: '16px', right: '16px', padding: '6px 12px' }}>✕</button>

        <div style={{ textAlign: 'center', marginTop: '12px', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>{selectedMethod.logo}</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>OTP Verification</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
            A 6-digit OTP was sent to<br />
            <span style={{ color: selectedMethod.color, fontWeight: 'bold' }}>
              {method === 'card' ? '**** **** **** ' + cardNumber.replace(/\s/g, '').slice(-4) : phone}
            </span>
          </div>
          {/* DEV helper — remove in production */}
          <div style={{ marginTop: '10px', background: '#111', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: '#555', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#444' }}>DEV MODE — OTP: </span>
            <span style={{ color: selectedMethod.color, fontWeight: 'bold', letterSpacing: '0.2em' }}>{generatedOtp}</span>
          </div>
        </div>

        <AmountBar />

        {error && (
          <div style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#ff6b6b', fontSize: '12px', marginBottom: '14px' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Enter 6-Digit OTP</label>
          <input
            style={{ ...inputStyle, textAlign: 'center', fontSize: '28px', letterSpacing: '0.6em', padding: '14px' }}
            placeholder="• • • • • •"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            autoFocus
          />
        </div>

        <button style={btnPrimary(selectedMethod.color)} onClick={handleOtpVerify}>
          ⚡ VERIFY & PAY {fmtAmount(amount)}
        </button>

        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <button
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--text-mono,monospace)', letterSpacing: '0.05em' }}
            onClick={() => {
              const newOtp = randomOtp();
              setGeneratedOtp(newOtp);
              console.log(`[GaanBajna Payment] Resent OTP: ${newOtp}`);
              setOtp('');
              setError('');
            }}>
            Didn't receive it? Resend OTP →
          </button>
        </div>
      </div>
    </div>
  );

  // ── PROCESSING ─────────────────────────────────────────────────────────────
  if (step === 'processing') return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div style={{ fontSize: '44px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '16px', color: '#fff', marginBottom: '6px' }}>
            {isFree ? 'Reserving Your Ticket...' : 'Processing Payment...'}
          </div>
          <div style={{ fontSize: '11px', color: '#555' }}>Please do not close this window</div>
          <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '9px', height: '9px', borderRadius: '50%',
                background: isFree ? '#00BFA6' : (selectedMethod?.color || '#D4A853'),
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
      </div>
    </div>
  );

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (step === 'success') return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
          <div style={{ fontSize: '60px', marginBottom: '12px' }}>{isFree ? '🎟️' : '✅'}</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: isFree ? '#00BFA6' : '#00ff64', marginBottom: '6px' }}>
            {isFree ? 'Ticket Reserved!' : 'Payment Successful!'}
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#fff', margin: '12px 0 4px' }}>
            {fmtAmount(amount)}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>{itemDescription}</div>

          <div style={{ background: '#111', borderRadius: '12px', padding: '16px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                ['Method',         isFree ? '🆓 Free Entry' : `${selectedMethod?.logo} ${selectedMethod?.label}`],
                ['Status',         '✅ Confirmed'],
                ['Transaction ID', txId],
                ['Time',           new Date().toLocaleTimeString('en-BD')],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: '9px', color: '#555', letterSpacing: '0.1em', marginBottom: '3px' }}>{k.toUpperCase()}</div>
                  <div style={{ fontSize: '11px', color: '#ccc', wordBreak: 'break-all' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '14px', fontSize: '11px', color: '#555' }}>
            {isFree
              ? 'Show your ticket QR code at the venue entrance.'
              : `A confirmation has been sent to your ${selectedMethod?.label} account.`}
          </div>
        </div>

        <button
          style={btnPrimary(isFree ? '#00BFA6' : (selectedMethod?.color || '#D4A853'))}
          onClick={onCancel}>
          🎵 CONTINUE TO GAANBAJNA
        </button>
      </div>
    </div>
  );

  // ── FAILED ─────────────────────────────────────────────────────────────────
  if (step === 'failed') return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
          <div style={{ fontSize: '60px', marginBottom: '12px' }}>❌</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff6b6b', marginBottom: '8px' }}>
            Payment Failed
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px', lineHeight: '1.7' }}>
            Your {selectedMethod?.label} payment could not be processed.<br />
            <span style={{ color: '#444' }}>No amount was deducted from your account.</span>
          </div>
          <div style={{ background: '#111', borderRadius: '10px', padding: '14px', fontSize: '11px', color: '#555', lineHeight: '1.8', textAlign: 'left', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ marginBottom: '4px', color: '#444' }}>Common reasons:</div>
            ● Insufficient balance<br />
            ● Incorrect PIN entered<br />
            ● Network timeout<br />
            ● Daily transaction limit reached
          </div>
        </div>

        <button style={btnPrimary(selectedMethod?.color || '#D4A853')} onClick={() => {
          setStep('method');
          setOtp('');
          setError('');
          setPin('');
          setPhone('');
        }}>
          ↩ TRY ANOTHER METHOD
        </button>
        <button style={{ ...btnGhost, width: '100%', marginTop: '10px' }} onClick={onCancel}>
          Cancel Payment
        </button>
      </div>
    </div>
  );

  return null;
}
