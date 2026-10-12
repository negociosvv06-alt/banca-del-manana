import { Route, Routes, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import Calculators from './pages/Calculators';
import * as P from './pages/Pages';

const Art = () => <P.ArticlePage id={useParams().id} />;
export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<P.Home />} />
    <Route path="banca-panama" element={<P.BancaPanama />} />
    <Route path="internacional" element={<P.Internacional />} />
    <Route path="bancos" element={<P.Bancos />} />
    <Route path="calculadoras" element={<Calculators />} />
    <Route path="calculadoras/:id" element={<Calculators />} />
    {['inversiones', 'medios-de-pago', 'fintech', 'educacion', 'finanzas-avanzadas', 'opinion'].map((s) => <Route key={s} path={s} element={<P.Section slug={s} />} />)}
    <Route path="articulo/:id" element={<Art />} />
    <Route path="glosario" element={<P.Glosario />} />
    <Route path="buscar" element={<P.Buscar />} />
    <Route path="fuentes" element={<P.Fuentes />} />
    <Route path="acerca" element={<P.Acerca />} />
    <Route path="metodologia" element={<P.Metodologia />} />
    <Route path="contacto" element={<P.Contacto />} />
    <Route path="privacidad" element={<P.Privacidad />} />
    <Route path="terminos" element={<P.Terminos />} />
    <Route path="aviso-legal" element={<P.AvisoLegal />} />
    <Route path="*" element={<P.NotFound />} />
  </Route></Routes>;
}
