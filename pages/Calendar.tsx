import React, { useState, useMemo, useEffect } from "react";
import { Appointment, Patient, AppUser } from "../types";
import { store } from "../services/store";
import { authStore } from "../services/authStore";
import { supabase } from "../services/supabase";
import {
  Plus,
  Calendar as CalendarIcon,
  Loader2,
  Info,
  X,
  Copy,
  Check,
} from "lucide-react";
import { getTodayStr } from "../src/utils/dateUtils";
import { CalendarGrid } from "../components/calendar_components/CalendarGrid";
import { CalendarSidebar } from "../components/calendar_components/CalendarSidebar";
import { CalendarAppointmentModal } from "../components/calendar_components/CalendarAppointmentModal";
import { CalendarHistorialTable } from "../components/calendar_components/CalendarHistorialTable";
import { CalendarSelector } from "../components/calendar_components/CalendarSelector";
import { CalendarGoogleSync } from "../components/calendar_components/CalendarGoogleSync";

const GC_COPY_TEXT = `Tipo: Primera Consulta o Seguimiento
Modalidad: Presencial o Video
Tel: 5512345678
Notas: texto libre opcional`;

const GoogleCalendarTip: React.FC<{ iconOnly?: boolean }> = ({ iconOnly = false }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(GC_COPY_TEXT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:border-slate-300 transition-all"
      >
        <Info className="w-4 h-4" />
        {iconOnly ? (
          <span className="text-[11px] font-medium leading-tight text-left">Tips<br />Google Calendar</span>
        ) : (
          <span className="text-[11px] font-medium">Tips Google Calendar</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    Cómo agendar desde Google Calendar
                  </h3>
                  <p className="text-xs text-slate-400">
                    NutriFollow importará el evento automáticamente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Steps */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Crea un evento en Google Calendar
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Abre Google Calendar y crea un nuevo evento con la fecha y
                      hora de la cita. Ajusta la duración arrastrando el bloque
                      o editando la hora de fin. Recuerda guardar en el
                      calendario NutriFollow Citas.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      En el <span className="text-blue-600">Título</span>{" "}
                      escribe el nombre del paciente
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Solo el nombre, sin más texto. NutriFollow lo usará como
                      nombre de la cita.
                    </p>
                    <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs text-slate-700">
                      Ej:{" "}
                      <span className="text-emerald-700 font-semibold">
                        María López
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-semibold text-slate-800">
                      En la <span className="text-blue-600">Descripción</span>{" "}
                      usa el siguiente formato
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 mb-2">
                      Elige solo una opción por campo y borra la que no aplica.
                      Tel y Notas son opcionales.
                    </p>

                    <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs space-y-1.5 leading-relaxed">
                      <p>
                        <span className="text-slate-400">Tipo:</span>{" "}
                        <span className="text-emerald-400">
                          Primera Consulta
                        </span>
                        <span className="text-slate-500"> o </span>
                        <span className="text-emerald-400">Seguimiento</span>
                        <span className="text-slate-600 italic">
                          {" "}
                          // elige 1 y borra el otro
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Modalidad:</span>{" "}
                        <span className="text-emerald-400">Presencial</span>
                        <span className="text-slate-500"> o </span>
                        <span className="text-emerald-400">Video</span>
                        <span className="text-slate-600 italic">
                          {" "}
                          // elige 1 y borra el otro
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">Tel:</span>{" "}
                        <span className="text-blue-300">5512345678</span>
                      </p>
                      <p>
                        <span className="text-slate-400">Notas:</span>{" "}
                        <span className="text-slate-300">
                          texto libre opcional
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={handleCopy}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />{" "}
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar plantilla
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-semibold text-slate-800">
                      Guarda el evento en el calendario correcto
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Asegúrate de guardar en el calendario vinculado con
                      NutriFollow. NutriFollow detectará el nuevo evento en
                      segundos y lo registrará automáticamente.
                    </p>

                    {/* Simulated Google Calendar event */}
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      {/* GCal header bar */}
                      <div className="bg-slate-100 px-3 py-1.5 flex items-center gap-2 border-b border-slate-200">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        <span className="ml-1 text-xs text-slate-400 font-medium">
                          Google Calendar — vista previa
                        </span>
                      </div>
                      {/* Event popup mock */}
                      <div className="p-4 space-y-3">
                        {/* Color dot + title */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-3.5 h-3.5 rounded-sm bg-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm font-semibold text-slate-900 leading-tight">
                            María López
                          </p>
                        </div>
                        {/* Date/time */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 pl-0.5">
                          <svg
                            className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Lunes, 7 de abril de 2025 · 10:00 – 11:00
                        </div>
                        {/* Description */}
                        <div className="flex items-start gap-2 text-xs text-slate-600 pl-0.5">
                          <svg
                            className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 6h16M4 12h16M4 18h7"
                            />
                          </svg>
                          <div className="font-mono space-y-0.5">
                            <p>
                              <span className="text-slate-500">Tipo:</span>{" "}
                              <span className="text-emerald-700 font-semibold">
                                Seguimiento
                              </span>
                            </p>
                            <p>
                              <span className="text-slate-500">Modalidad:</span>{" "}
                              <span className="text-emerald-700 font-semibold">
                                Presencial
                              </span>
                            </p>
                            <p>
                              <span className="text-slate-500">Tel:</span>{" "}
                              <span className="text-blue-600">5512345678</span>
                            </p>
                          </div>
                        </div>
                        {/* Calendar name */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 pl-0.5">
                          <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                          Calendario: NutriFollow Citas
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar warning */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  Sobre el calendario
                </p>
                <ul className="space-y-1.5 text-xs text-slate-500">
                  <li className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1" />
                    <span>NutriFollow crea automáticamente un calendario llamado "NutriFollow Citas" en tu Google Calendar al conectarte.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1" />
                    <span>Puedes cambiarle el nombre sin problema, la conexión no se pierde.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1" />
                    <span>No lo elimines: si lo borras se perderá la sincronización y tendrás que desconectar y volver a conectar desde NutriFollow.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1" />
                    <span>Si no agregas descripción o los valores no coinciden exactamente, NutriFollow usará los valores por defecto: Primera Consulta y Presencial.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user] = useState(store.getUserProfile());
  const currentAppUser = authStore.getCurrentUser();

  const [selectedNutritionistId, setSelectedNutritionistId] = useState<
    string | null
  >(
    authStore.getSelectedNutritionistId(), // ✅ quita el || currentAppUser?.id
  );

  const [linkedNutritionists, setLinkedNutritionists] = useState<AppUser[]>([]);

  const [canViewCalendar, setCanViewCalendar] = useState(true);
  const [isLoadingAccess, setIsLoadingAccess] = useState(
    currentAppUser?.role === "recepcionista",
  );

  const showCalendarSelector = authStore.canAccessModule(
    "calendar",
    "calendar-selector",
  );
  const canCreateAppointments =
    !showCalendarSelector || linkedNutritionists.length > 0;

  const targetNutritionistId = useMemo(() => {
    if (currentAppUser?.role === "nutricionista") return currentAppUser.id;
    if (showCalendarSelector && linkedNutritionists.length > 0) {
      return selectedNutritionistId || linkedNutritionists[0].id;
    }
    return currentAppUser?.id || "guest";
  }, [
    currentAppUser,
    showCalendarSelector,
    selectedNutritionistId,
    linkedNutritionists,
  ]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    if (currentAppUser?.role !== "recepcionista") return;

    const initReceptionistAccess = async () => {
      setIsLoadingAccess(true);

      // 1. Obtener nutricionistas vinculadas (usa cache si ya cargó)
      const nutris = await authStore.getLinkedNutritionists();
      setLinkedNutritionists(nutris);

      let resolvedNutritionistId = selectedNutritionistId;
      if (nutris.length > 0 && !resolvedNutritionistId) {
        resolvedNutritionistId = nutris[0].id;
        setSelectedNutritionistId(nutris[0].id);
      }

      // 2. Verificar acceso al vínculo en DB
      if (resolvedNutritionistId) {
        const { data, error } = await supabase
          .from("profile_links")
          .select("id")
          .eq("nutritionist_id", resolvedNutritionistId)
          .eq("receptionist_id", currentAppUser.id);
        setCanViewCalendar(!error && Boolean(data && data.length > 0));
      } else {
        setCanViewCalendar(false);
      }

      setIsLoadingAccess(false);
    };

    initReceptionistAccess();
  }, [currentAppUser?.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (targetNutritionistId === currentAppUser?.id) {
          setAppointments(store.getAppointments());
          setPatients(store.getPatients());
        } else {
          const appts =
            await store.getAppointmentsForNutritionist(targetNutritionistId);
          setAppointments(appts);
          setPatients(store.getPatientsForNutritionist(targetNutritionistId));
        }
      } catch (error) {
        console.error("Error fetching calendar data:", error);
      }
    };
    fetchData();
  }, [targetNutritionistId, currentAppUser?.id]);

  // ── Supabase Realtime: refresh when webhook updates appointments ──────────────
  useEffect(() => {
    if (!targetNutritionistId || targetNutritionistId === "guest") return;

    const channel = supabase
      .channel(`appointments:${targetNutritionistId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `owner_id=eq.${targetNutritionistId}`,
        },
        () => {
          handleRefresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetNutritionistId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedAppointment, setSelectedAppointment] = useState<
    Partial<Appointment>
  >({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = getTodayStr(user.timezone);

  const fiveDaysFromNowDate = new Date();
  fiveDaysFromNowDate.setDate(fiveDaysFromNowDate.getDate() + 5);
  const d = fiveDaysFromNowDate;
  const fiveDaysFromNowStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1));

  const handleCreateAppointment = (day?: number) => {
    const dateStr = day
      ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : todayStr;
    setSelectedAppointment({
      date: dateStr,
      time: "09:00",
      duration: 60,
      type: "Primera Cita",
      modality: "Presencial",
      status: "Programada",
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleEditAppointment = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleRefresh = async () => {
    try {
      if (targetNutritionistId === currentAppUser?.id) {
        setAppointments(store.getAppointments());
        setPatients(store.getPatients());
      } else {
        const appts =
          await store.getAppointmentsForNutritionist(targetNutritionistId);
        setAppointments(appts);
        setPatients(store.getPatientsForNutritionist(targetNutritionistId));
      }
    } catch (error) {
      console.error("Error refreshing calendar data:", error);
    }
  };

  const handleNutritionistChange = (nutritionistId: string) => {
    setSelectedNutritionistId(nutritionistId);
    authStore.setSelectedNutritionistId(nutritionistId);
  };

  if (isLoadingAccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm font-medium">
          Verificando acceso al calendario...
        </p>
      </div>
    );
  }

  if (!canViewCalendar) {
    return (
      <div className="p-8 max-w-xl mx-auto flex flex-col items-center justify-center gap-4">
        <div className="bg-red-100 text-red-600 rounded-full w-16 h-16 flex items-center justify-center mb-2">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <p className="text-xl font-bold text-red-700 text-center">
          No tienes acceso al calendario de esta nutricionista
        </p>
        <p className="text-slate-500 text-center">
          Solicita a la nutricionista que te vincule para poder ver y agendar en
          su calendario.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              Calendario
            </h1>
            <p className="text-slate-500 mt-1">Gestiona tus citas y agenda</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Google Calendar sync — only for the nutritionist/admin who owns the calendar */}
            {currentAppUser?.role !== "recepcionista" && currentAppUser?.id && (
              <>
                {/* Desktop: full buttons */}
                <span className="hidden sm:contents">
                  <CalendarGoogleSync userId={currentAppUser.id} />
                  <GoogleCalendarTip />
                </span>
              </>
            )}
            {canCreateAppointments && (
              <button
                onClick={() => handleCreateAppointment()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Nueva Cita
              </button>
            )}
            {/* Mobile: icon-only Google Calendar buttons, shown to the right of Nueva Cita */}
            {currentAppUser?.role !== "recepcionista" && currentAppUser?.id && (
              <span className="flex sm:hidden items-center gap-2">
                <CalendarGoogleSync userId={currentAppUser.id} iconOnly />
                <GoogleCalendarTip iconOnly />
              </span>
            )}
          </div>
        </div>

        {/* Calendar Selector */}
        {showCalendarSelector &&
          (linkedNutritionists.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">
                  No tienes nutricionistas vinculadas
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Ve a <strong>Configuración</strong> para vincular una
                  nutricionista y activar la función de agendar en su
                  calendario.
                </p>
              </div>
            </div>
          ) : (
            <CalendarSelector
              currentUserId={currentAppUser?.id || ""}
              currentUserName={currentAppUser?.profile?.name || "Mi Calendario"}
              linkedNutritionists={linkedNutritionists}
              selectedNutritionistId={targetNutritionistId}
              onNutritionistChange={handleNutritionistChange}
            />
          ))}

        {/* Calendar + Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CalendarSidebar
            todayStr={todayStr}
            fiveDaysFromNowStr={fiveDaysFromNowStr}
            appointments={appointments}
            onAppointmentClick={handleEditAppointment}
          />
          <CalendarGrid
            currentDate={currentDate}
            appointments={appointments}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onDayClick={
              canCreateAppointments ? handleCreateAppointment : undefined
            }
            onAppointmentClick={(e, appt) => {
              e.stopPropagation();
              handleEditAppointment(appt);
            }}
          />
        </div>

        {/* Historial Table */}
        <CalendarHistorialTable
          appointments={appointments}
          currentYear={year}
          currentMonth={month + 1}
          todayStr={todayStr}
          targetNutritionistId={targetNutritionistId}
          isManagingForOtherNutritionist={
            targetNutritionistId !== currentAppUser?.id
          }
          onEditClick={handleEditAppointment}
          onRefresh={handleRefresh}
        />

        {/* Modal */}
        {isModalOpen && (
          <CalendarAppointmentModal
            mode={modalMode}
            appointment={selectedAppointment}
            targetNutritionistId={targetNutritionistId}
            isManagingForOtherNutritionist={
              targetNutritionistId !== currentAppUser?.id
            }
            onClose={() => setIsModalOpen(false)}
            onSaved={handleRefresh}
          />
        )}
      </div>
    </div>
  );
};
