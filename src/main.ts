import { createRoute17App } from './bootstrap/app'
import { createDeps } from './bootstrap/deps'
import './styles/main.css'

const { app } = createRoute17App(createDeps())
app.mount('#app')
