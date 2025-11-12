'use client';
import React, { useEffect, useMemo, useState } from "react";

const PRICE_PER_VEHICLE = 12000;
const SECTORS = [
  { id: "rio", name: "El río", cupos: 10, desc: "Orillas limpias y acceso directo al balneario." },
  { id: "sombra", name: "La sombra", cupos: 10, desc: "Arboleda amplia, reparo y siesta asegurada." },
];

const WHATSAPP = "+54 9 3512756126"; 
const EMAIL = "gestiondigitalsdi@gmail.com";

export default function LaFontanaBooking() {
  const [date, setDate] = useState("");
  const [sector, setSector] = useState("");
  const [persons, setPersons] = useState(1);
  const [vehicles, setVehicles] = useState(1);
  const [grills, setGrills] = useState(1);
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<null | { total:number; reserved:number; remaining:number}>(null);
  const [toast, setToast] = useState<string | null>(null);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }, []);

  const total = useMemo(() => Math.max(0, vehicles) * PRICE_PER_VEHICLE, [vehicles]);
  const maxGrillsAllowedByVehicles = useMemo(() => (vehicles >= 2 ? 2 : 1), [vehicles]);
  const maxPersonsAllowed = useMemo(() => Math.max(1, vehicles) * 5, [vehicles]);
  const personsHint = persons > maxPersonsAllowed ? `Supera el máximo de ${maxPersonsAllowed} personas para ${vehicles} vehículo(s).` : "";
  const maxGrillsByAvailability = availability ? Math.min(maxGrillsAllowedByVehicles, availability.remaining || 0) : maxGrillsAllowedByVehicles;

  useEffect(() => {
    let cancelled = false;
    async function checkAvailability(){
      if(!date || !sector){ setAvailability(null); return; }
      try{
        const res = await fetch(`/api/availability?date=${encodeURIComponent(date)}&sector=${encodeURIComponent(sector)}`);
        if(res.ok){
          const data = await res.json();
          if(!cancelled){
            const total = data.total ?? SECTORS.find(s=>s.id===sector)?.cupos ?? 10;
            const reserved = data.reserved ?? 0;
            const remaining = Math.max(0, total - reserved);
            setAvailability({ total, reserved, remaining });
          }
        } else {
          const total = SECTORS.find(s=>s.id===sector)?.cupos ?? 10;
          setAvailability({ total, reserved: 0, remaining: total });
        }
      } catch {
        const total = SECTORS.find(s=>s.id===sector)?.cupos ?? 10;
        setAvailability({ total, reserved: 0, remaining: total });
      }
    }
    checkAvailability();
    return ()=>{ cancelled = true };
  }, [date, sector]);

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault();
    setToast(null);
    if(persons > maxPersonsAllowed){
      setToast(`Ajustá personas o aumentá vehículos (máximo ${maxPersonsAllowed} personas)`);
      return;
    }
    if(!availability){
      setToast("Seleccioná fecha y sector para validar cupos");
      return;
    }
    if(availability.remaining <= 0){
      setToast("Sin cupo disponible en ese sector para esa fecha");
      return;
    }
    if(grills < 1){ setToast("Elegí al menos 1 asador"); return; }
    if(grills > maxGrillsAllowedByVehicles){ setToast(`Con ${vehicles} vehículo(s) podés reservar hasta ${maxGrillsAllowedByVehicles} asador(es).`); return; }
    if(grills > (availability.remaining || 0)){ setToast(`Quedan ${availability.remaining} asador(es) disponibles en este sector para esa fecha.`); return; }

    const payload = {
      fecha: date,
      sector_id: sector,
      grills_reservados: grills,
      personas: persons,
      vehiculos: vehicles,
      nombre: fullname,
      telefono: phone,
      email,
      metodo_pago: payment === "mp" ? "mercado_pago" : "efectivo_transferencia",
      monto_total: total,
      politicas: {
        cancelacion: "Hasta las 10:00 AM del día reservado devolución total. Luego, se retienen $2.000.",
      },
    };

    try{
      setSubmitting(true);
      const res = await fetch("/api/reservas",{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if(res.ok){
        const out = await res.json().catch(()=>({}));
        const msg = out?.message || (payment === "mp" ? "Reserva preconfirmada. Te enviamos el link de pago." : "Reserva tomada. Te confirmamos por WhatsApp y email.");
        setToast(msg);
        if(out?.payment_link){
          window.location.href = out.payment_link;
        }
      } else {
        setToast("No se pudo enviar la reserva. Probá de nuevo en unos minutos.");
      }
    } catch {
      setToast("Conexión caída. Probá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white text-slate-800">
      <header className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-sky-600 flex items-center justify-center text-white font-bold shadow">LF</div>
          <div>
            <h1 className="text-2xl font-semibold">Parador La Fontana</h1>
            <p className="text-sm text-slate-600">Reservá tu asador • 10:00–19:00 • Los Reartes</p>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 pb-24">
        <section className="mb-6 rounded-3xl overflow-hidden shadow-sm border border-slate-200">
          <div className="relative h-48 md:h-64 bg-cover bg-center" style={{backgroundImage: `url('/la-fontana/entrada-portal.jpg')`}}>
            <div className="absolute inset-0 bg-black/30"/>
            <div className="absolute bottom-0 p-4 md:p-6 text-white">
              <h2 className="text-xl md:text-2xl font-semibold">Río limpio, sombra abundante, asadores listos</h2>
              <p className="text-sm md:text-base opacity-90">Elegí fecha y sector. El precio es por vehículo e incluye asador, mesa, parrilla y más.</p>
            </div>
          </div>
        </section>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <section className="md:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Fecha</label>
                  <input type="date" required min={minDate} value={date} onChange={(e)=>setDate(e.target.value)} className="mt-1 rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500" />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Sector</label>
                  <select required value={sector} onChange={(e)=>setSector(e.target.value)} className="mt-1 rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500">
                    <option value="">Elegí…</option>
                    {SECTORS.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {sector && (<p className="text-xs text-slate-500 mt-1">{SECTORS.find(s=>s.id===sector)?.desc}</p>)}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Personas</label>
                  <input type="number" min={1} value={persons} onChange={(e)=>setPersons(parseInt(e.target.value||'0'))} className="mt-1 rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500" />
                  <p className="text-xs text-slate-500 mt-1">Hasta 5 por vehículo.</p>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Vehículos</label>
                  <input type="number" min={1} value={vehicles} onChange={(e)=>{const v=parseInt(e.target.value||'0'); setVehicles(v); if(v<2) setGrills(1);}} className="mt-1 rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500" />
                  <p className="text-xs text-slate-500 mt-1">$ {PRICE_PER_VEHICLE.toLocaleString('es-AR')} c/u.</p>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Asadores</label>
                  <input type="number" min={1} max={maxGrillsByAvailability || 1} value={grills} onChange={(e)=>setGrills(Math.max(1, Math.min(parseInt(e.target.value||'1'), maxGrillsByAvailability || 1)))} className="mt-1 rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500" />
                  <p className="text-xs text-slate-500 mt-1">{vehicles<2 ? 'Con 1 vehículo podés elegir 1 asador' : 'Con 2+ vehículos podés elegir hasta 2 asadores (según cupo)'}</p>
                </div>
              </div>
              {personsHint && (<div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{personsHint}</div>)}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Nombre y apellido</label>
                  <input required value={fullname} onChange={(e)=>setFullname(e.target.value)} className="mt-1 rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500" />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Teléfono</label>
                  <input required pattern="^[0-9+ ()-]{7,}$" value={phone} onChange={(e)=>setPhone(e.target.value)} className="mt-1 rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500" />
                  <p className="text-xs text-slate-500 mt-1">Usaremos WhatsApp para confirmarte.</p>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium">Email (opcional)</label>
                <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500" />
              </div>
              <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <legend className="text-sm font-medium mb-1">Método de pago</legend>
                <label className={`flex items-center gap-2 p-3 rounded-2xl border ${payment==='cash'?'border-sky-500 bg-sky-50':'border-slate-200'}`}>
                  <input type="radio" name="pago" value="cash" checked={payment==='cash'} onChange={()=>setPayment('cash')} />
                  <span>Efectivo/Transferencia al ingresar</span>
                </label>
                <label className={`flex items-center gap-2 p-3 rounded-2xl border ${payment==='mp'?'border-sky-500 bg-sky-50':'border-slate-200'}`}>
                  <input type="radio" name="pago" value="mp" checked={payment==='mp'} onChange={()=>setPayment('mp')} />
                  <span>Link de Mercado Pago (pago online)</span>
                </label>
              </fieldset>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
                <span>Acepto términos y política de cancelación: hasta las 10:00 AM del mismo día se devuelve el monto total; luego se retienen $2.000.</span>
              </label>
              <button disabled={submitting || !agree} type="submit" className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 text-white font-medium shadow hover:bg-sky-700 disabled:opacity-50">
                {submitting ? 'Enviando…' : 'Confirmar reserva'}
              </button>
              {toast && (<div className="text-sm mt-2 p-3 rounded-xl border border-slate-200 bg-white shadow-sm">{toast}</div>)}
            </form>
          </section>
          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold">Resumen</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span>Fecha</span><span>{date || '—'}</span></div>
                <div className="flex justify-between"><span>Sector</span><span>{sector ? SECTORS.find(s=>s.id===sector)?.name : '—'}</span></div>
                <div className="flex justify-between"><span>Personas</span><span>{persons}</span></div>
                <div className="flex justify-between"><span>Vehículos</span><span>{vehicles}</span></div>
                <div className="flex justify-between"><span>Asadores</span><span>{grills}</span></div>
                <div className="border-t my-2"/>
                <div className="flex justify-between font-medium text-slate-900"><span>Total</span><span>$ {total.toLocaleString('es-AR')}</span></div>
                <p className="text-xs text-slate-500 mt-1">Precio por vehículo. Incluye asador, parrilla, mesa, elementos, baños y estacionamiento vigilado (10–19 h). Sillas/banquetas sujetas a disponibilidad.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <footer className="max-w-4xl mx-auto px-4 py-10 text-center text-xs text-slate-500">© {new Date().getFullYear()} Parador La Fontana • Los Reartes, Córdoba</footer>
    </div>
  );
}
