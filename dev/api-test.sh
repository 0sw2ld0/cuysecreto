#!/bin/sh
# Prueba de punta a punta de la API RPC contra el entorno local (o el de Supabase con API/KEY).
API=${API:-http://localhost:54321}
KEY=${KEY:-}
rpc() { curl -s -X POST "$API/rpc/$1" -H "Content-Type: application/json" ${KEY:+-H "apikey: $KEY"} -d "$2"; }
j() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const o=JSON.parse(d);console.log(eval('o'+process.argv[1]))})" "$1"; }

C=$(rpc cs_create_event '{"p_name":"Navidad Test","p_budget":80,"p_currency":"PEN","p_exchange_date":"2026-12-24","p_note":"En casa de la abuela","p_participants":["Ana","Beto","Caro","Dani"]}')
CODE=$(echo "$C" | j .code); ADM=$(echo "$C" | j .admin_token); echo "evento $CODE"
P=$(rpc cs_event_public "{\"p_code\":\"$(echo $CODE | tr A-Z a-z)\"}")
ANA=$(echo "$P" | j ".participants.find(x=>x.name==='Ana').id")
BETO=$(echo "$P" | j ".participants.find(x=>x.name==='Beto').id")
echo "join nuevo:"; T=$(rpc cs_join "{\"p_code\":\"$CODE\",\"p_participant\":\"$ANA\",\"p_pin\":\"1234\"}"); echo "$T"
TOK=$(echo "$T" | j .token)
echo "pin malo:"; rpc cs_join "{\"p_code\":\"$CODE\",\"p_participant\":\"$ANA\",\"p_pin\":\"0000\"}"; echo
echo "pin bueno (otro celular):"; rpc cs_join "{\"p_code\":\"$CODE\",\"p_participant\":\"$ANA\",\"p_pin\":\"1234\"}" | j .ok
echo "deseo:"; rpc cs_wish_save "{\"p_token\":\"$TOK\",\"p_id\":null,\"p_title\":\"Audífonos\",\"p_note\":\"negros\",\"p_store\":\"Falabella\",\"p_url\":\"falabella.com.pe/x\",\"p_price\":79.9,\"p_priority\":1}" | j .me.wishes
echo "reveal antes de sorteo:"; rpc cs_reveal "{\"p_token\":\"$TOK\"}"; echo
echo "exclusión Ana-Beto:"; rpc cs_admin_toggle_exclusion "{\"p_code\":\"$CODE\",\"p_token\":\"$ADM\",\"p_a\":\"$ANA\",\"p_b\":\"$BETO\"}" | j .exclusions.length
echo "admin token malo:"; rpc cs_admin_get "{\"p_code\":\"$CODE\",\"p_token\":\"nope\"}"; echo
echo "sorteo:"; rpc cs_admin_draw "{\"p_code\":\"$CODE\",\"p_token\":\"$ADM\"}" | j .event.drawn
echo "admin no ve parejas:"; rpc cs_admin_get "{\"p_code\":\"$CODE\",\"p_token\":\"$ADM\"}" | grep -c receiver
echo "reveal:"; rpc cs_reveal "{\"p_token\":\"$TOK\"}" | j .receiver
echo "deshacer tras reveal:"; rpc cs_admin_undo_draw "{\"p_code\":\"$CODE\",\"p_token\":\"$ADM\"}"; echo
echo "lectura directa de tabla (debe fallar):"; curl -s "$API/cs_participants" ${KEY:+-H "apikey: $KEY"}; echo
echo "función interna (debe fallar):"; rpc cs__hash '{"p":"x"}'; echo
echo "bloqueo tras 5 fallos:"; for i in 1 2 3 4 5; do rpc cs_join "{\"p_code\":\"$CODE\",\"p_participant\":\"$ANA\",\"p_pin\":\"9999\"}" | j .error; done
rpc cs_join "{\"p_code\":\"$CODE\",\"p_participant\":\"$ANA\",\"p_pin\":\"1234\"}"; echo
echo "reset pin:"; rpc cs_admin_reset_pin "{\"p_code\":\"$CODE\",\"p_token\":\"$ADM\",\"p_participant\":\"$ANA\"}" | j ".participants.find(x=>x.name==='Ana').has_pin"
