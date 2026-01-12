import LMStudioConnectPlugin from "src/main";
import { createContext } from "svelte";

export const [getPluginContext, setPluginContext] = createContext<LMStudioConnectPlugin>();
