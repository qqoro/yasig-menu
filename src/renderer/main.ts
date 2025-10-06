import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "vue-sonner/style.css";
import "./style.css";

const pinia = createPinia();
const app = createApp(App);

app.use(router).use(pinia).mount("#app");
