import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/LoginPage.vue'
import Main from '../views/Main.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/main', component: Main }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router