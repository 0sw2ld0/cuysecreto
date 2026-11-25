// Configuración pública. La clave "publishable" de Supabase es pública por diseño:
// las tablas están cerradas con RLS y solo se puede llamar a las funciones cs_*.
// Nunca pongas aquí la clave secreta (sb_secret_… / service_role).
window.CUY_CONFIG = {
  apiUrl: "https://sxezzwcygwtlqbdrslrr.supabase.co/rest/v1",
  anonKey: "sb_publishable_BHzyXzq8oJMHvAZGyO5XYQ_GrWcGtTk",
};
