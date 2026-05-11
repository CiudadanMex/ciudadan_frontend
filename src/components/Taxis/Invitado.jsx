import React from "react";
import { motion } from "framer-motion";
import { Button, Typography, Paper, ListItemIcon, useMediaQuery } from "@mui/material";
import { useNavigate } from 'react-router-dom';

import "./MapAnimation.css";

import LaboryBadge from '../LaboryBadge.jsx';
import mapa from "../../assets/mapa.png";
import MapAnimation from './MapAnimation.jsx';

const Invitado = () => {  
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  // Integración para tablet
  const isTablet = useMediaQuery("(min-width:601px) and (max-width:900px)");
  const laboryPositionX = isMobile ? "33%" : isTablet ? "33%" : "45%";
  const laboryPositionY = isMobile ? "26%" : isTablet ? "26%" : "40%";
  

  const handleNavigation = (path) => {
  
    navigate(path);
  };

  return (
    <motion.div
      style={{
        position: "relative",
        width: "100%",
        // Ajuste de altura para tablet
        height: isMobile ? "420vh" : isTablet ? "279vh" : "166vh",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <MapAnimation taxiMovilPosicionY="40%" direction="left" />
      <MapAnimation taxiMovilPosicionY="20%" direction="right" />
      <MapAnimation taxiMovilPosicionY="60%" direction="right" />

      <Paper
        component={motion.div}
        elevation={8}
        sx={{
          position: "absolute",
          zIndex: 3,
          textAlign: "center",
          borderRadius: "10px",
          padding: "20px",
          background: `linear-gradient(rgba(232, 50, 201, 0.7), rgba(255, 255, 255, 0.70)), url(${mapa})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          // Integración de breakpoint tablet (sm) en MUI
          width: { xs: "80%", sm: "90%", md: "90%" },
          minHeight: { xs: "420vh", sm: "276vh", md: "163vh" },
          display: "flex",
          flexDirection: "column",
        }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.8 }}
        transition={{ duration: 0.5 }}
      >
        {/* Título con personalidad moderada */}
        <Typography
          variant="h3"
          gutterBottom
          component={motion.div}
          animate={{ scale: [1, 1.03, 1] }}
          sx={{
            fontFamily: "'schwager-sans', sans-serif",
            fontWeight: 700,
            letterSpacing: "3px",
            color: "rgba(236, 232, 29, 0.88)",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            height: { xs: 70, md: 110 },
            width: "90%", // Se asegurará de ocupar el 90% del contenedor padre
            display: "flex", // Asegura que se estire en horizontal
            justifyContent: "center", // Centra el texto horizontalmente
            alignItems: "center", // Centra verticalmente dentro del contenedor
            textAlign: "center", // Centra el texto si hay varias líneas
            marginBottom: { xs: "10px", sm: "0px", md: "0px" },
            textTransform: "capitalize",
            fontSize: { xs: "0.7rem", sm: "1.1rem", md: "2.6rem" },
            //whiteSpace: "nowrap", // **Fuerza a que el texto esté en 1 sola línea**
            overflow: "hidden", // Evita que el texto se salga
            textOverflow: "ellipsis", // Muestra "..." si no cabe
            wordWrap: "break-word", // Permite que el texto se divida en varias líneas
          }}
          
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
            <i className="material-icons" style={{ color:"yellow", fontSize: "40px", verticalAlign: "middle" }}>
            local_taxi
          </i>{" "}
          Ciudadan Taxi:<small style={{ display: "block", marginTop: "5px", fontSize: "1rem" }}> Fusión Perfecta de Justicia Social y Comodidad.</small>
        </Typography>

        <Typography
          variant="body1"
          style={{
            marginBottom: "20px",
            fontFamily: "'molto', sans-serif",
            fontSize: "1.1rem",
            color: "rgba(247, 243, 243, 0.86)"
          }}
        >
          Toda la ganancia es para el conductor, quien solo paga una tarifa plana de $200MXN mensuales, lo que le permite bajar sus precios y además aceptar hasta el 10% en Labory, la moneda de uso corriente de Ciudadan.org

          Experimenta la fusión perfecta entre la excelente tarifa tradicional de los taxis concesionados y la
          innovación de los servicios por aplicación en CDMX. Para disfrutar de todos estos
          beneficios, es necesario registrarse con tu teléfono.
        </Typography>

        {/* Sección 1 - Alineada a la izquierda */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          whileHover={{
            scale: 1.03,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
          style={{
            marginBottom: "15px",
            textAlign: "left",
            borderRadius: "8px",
            padding: "8px",
            borderLeft: "4px solid rgba(228, 243, 16, 0.87)",
            paddingLeft: "12px",
            width: "44%",
          }}
        >
          <Typography
            variant="h6"
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "'molto', sans-serif",
              fontWeight: 600,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, marginRight: "8px" }}>
              <i className="material-icons" style={{ color: "yellow" }}>
                attach_money
              </i>
            </ListItemIcon>
            Taxis concesionados al mejor precio de la ciudad.
          </Typography>
          <Typography
            variant="subtitle2"
            color="textSecondary"
            sx={{ fontFamily: "'molto', sans-serif" }}
          >
            Las comodidades de los taxis de aplicación ahora con el precio de los taxis de concesión que brindan este servicio autogestivo cooperativista 6.0.
          </Typography>
        </motion.div>

        {/* Sección 2 - Alineada a la derecha */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          whileHover={{
            scale: 1.03,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
          style={{
            marginBottom: "15px",
            textAlign: "right",
            borderRadius: "8px",
            padding: "8px",
            borderRight: "4px solid rgba(252,249,250,0.9)",
            paddingRight: "12px",
            width: "44%",
            marginLeft: "auto",
          }}
        >
          <Typography
            variant="h6"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              fontFamily: "'molto', sans-serif",
              fontWeight: 600,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, marginRight: "8px" }}>
              <i className="material-icons" style={{ color: "yellow" }}>
                security
              </i>
            </ListItemIcon>
            Seguridad reforzada con tecnología de aplicación
          </Typography>
          <Typography
            variant="subtitle2"
            color="textSecondary"
            sx={{ fontFamily: "'molto', sans-serif" }}
          >
            Tu seguridad es nuestra prioridad. Seguimiento en tiempo real, compartir recorrido con contacto solidario, verificación constante y otras medidas de seguridad de primera.
            de conductores.
          </Typography>
        </motion.div>


        
        <a onClick={() => handleNavigation('/cartera/labory')} href="#">
          <div 
              style={{ 
                  position: "absolute", 
                  top: laboryPositionY, 
                  left: laboryPositionX,
                  transform: "translate(-50%, -50%)",
                  marginRight: "10px"
              }}
          >
              <LaboryBadge />
          </div>
        </a>





        {/* Sección 3 - Alineada a la izquierda */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileHover={{
            scale: 1.03,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
          style={{
            marginLeft: "10px",
            marginBottom: "20px",
            textAlign: "left",
            borderRadius: "8px",
            padding: "8px",
            borderLeft: "4px solid yellow",
            paddingLeft: "12px",
            width: "30%",
          }}
        >
          <Typography
            variant="h6"
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "'molto', sans-serif",
              fontWeight: 600,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, marginRight: "8px" }}>
            <i className="material-icons" style={{ color: "yellow" }}>account_balance_wallet</i>

            </ListItemIcon>
            Ahorra Pagando con Laborys
          </Typography>
          <Typography
            variant="subtitle2"
            color="textSecondary"
            sx={{ fontFamily: "'molto', sans-serif" }}
          >
            Paga hasta un 10% del importe de tus viajes con Laborys, la Moneda de Ciudadan.org
            <br />
            <a onClick={() => handleNavigation('/gana')} href="#">
              ¿ Cómo Ganar Laborys ?
            </a>
          </Typography>
        </motion.div>

        {/* Botón con mayor caché */}
        <Button
          variant="contained"
          sx={{
            marginTop: "15px",
            backgroundColor: "#FF1493", // Rosa fuerte
            color: "white",
            fontWeight: "bold",
            padding: "10px 20px",
            fontSize: "1rem",
            fontFamily: "'molto', sans-serif",
            color: "yellow",
          }}
          onClick={() => handleNavigation('/taxis/pasajero/registro')}
          component={motion.button}
          whileHover={{
            scale: 1.1,
            boxShadow: "0px 0px 12px white",
          }}
          transition={{ duration: 0.3 }}
          startIcon={
            <i className="material-icons" style={{ color: "yellow", fontSize: "1.3rem" }}>
              person_pin_circle
            </i>
          }
        >
          Únete y Viaja Seguro
        </Button>
        <div className="conoces-taxi ct1">
        <a onClick={() => handleNavigation('/taxis/conductor/preregistro')} href="#"> ¿ Eres  Conductor de Taxi Concesionado en CDMX ?</a>
        </div>
        
      </Paper>
    </motion.div>
  );
};

export default Invitado;
