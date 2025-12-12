import React from "react";
import { SplineScene } from "./ui/spline";
import { Card } from "./ui/card";
import { Spotlight } from "./ui/spotlight";
 
export function WelcomeScene() {
  return (
    <Card className="w-full h-[500px] bg-black/50 border-zinc-800 relative overflow-hidden rounded-3xl">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      
      <div className="flex flex-col md:flex-row h-full">
        {/* Left content */}
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            Gemini Nova
          </h1>
          <p className="mt-4 text-neutral-300 max-w-lg leading-relaxed">
            Experimente o futuro da IA multimodal. 
            Envolva-se em raciocínio profundo, colaboração criativa e análise visual interativa em um espaço de trabalho 3D unificado.
          </p>
          <div className="mt-6 text-sm text-neutral-500 font-mono">
            Pronto para inicializar...
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 relative min-h-[300px] md:min-h-full">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}