import { createPinia } from "pinia";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./style.css";

const pinia = createPinia();
const app = createApp(App);

app.use(router).use(pinia).mount("#app");
