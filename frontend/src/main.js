import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
window.L = L;

import { LMap, LTileLayer, LMarker, LPopup, LControlScale, LPolyline, LPolygon } from '@vue-leaflet/vue-leaflet';

const app = createApp(App);
app.component('l-map', LMap);
app.component('l-tile-layer', LTileLayer);
app.component('l-marker', LMarker);
app.component('l-popup', LPopup);
app.component('l-control-scale', LControlScale);
app.component('l-polyline', LPolyline);
app.component('l-polygon', LPolygon);

app.use(router).mount('#app');
