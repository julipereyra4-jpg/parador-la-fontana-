'use client';
import React, { useEffect, useMemo, useState } from "react";

// MVP de Reserva para Parador La Fontana
// Mobile-first, sin dependencias externas. Listo para pegar en un proyecto Next.js o CRA.
// Notas:
// - Precio por vehículo: $12.000 (1 a 5 personas por vehículo)
// - Cupos por sector (por día): 10 (El río), 10 (La sombra)
// - Métodos de pago: efectivo o link de Mercado Pago (pago total)
// - Política de cancelación: hasta las 10:00 AM del mismo día: devolución total. Luego: se descuentan $2.000.

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
          <div className="relative h-48 md:h-64 bg-cover bg-center" style={{backgroundImage: `url('/la-fontana/playa.jpg')`}}>
            <div className="absolute inset-0 bg-black/30"/>
            <div className="absolute bottom-0 p-4 md:p-6 text-white">
              <h2 className="text-xl md:text-2xl font-semibold">Río limpio, sombra abundante, asadores listos</h2>
              <p className="text-sm md:text-base opacity-90">Elegí fecha y sector. El precio es por vehículo e incluye asador, mesa, parrilla y más.</p>
            </div>
          </div>
        </section>

        {/* (Resto del código igual que tu versión anterior) */}
      </main>
    </div>
  );
}
