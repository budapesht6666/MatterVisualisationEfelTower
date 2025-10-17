import React from "react";

import { TowerScene } from "@/components/TowerScene";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Github, Menu } from "lucide-react";

const models = [
  { value: "eiffel", label: "Эйфелева башня" },
];

const App: React.FC = () => {
  const [model, setModel] = React.useState(models[0].value);

  return (
    <TooltipProvider>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-border/50 bg-card/60 p-4 shadow-2xl shadow-primary/10 backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/90 text-primary-foreground shadow-lg">
                <span className="text-xl font-black tracking-tight">MV</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold uppercase tracking-[0.25em] text-foreground/80">Matter Vision</span>
                <span className="text-sm text-muted-foreground">Эксперименты с архитектурой</span>
              </div>
            </div>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Меню</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Модель</span>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-full min-w-[220px] border-border/70 bg-background/80 backdrop-blur">
                  <SelectValue placeholder="Выберите модель" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="secondary"
                  size="icon"
                  className="shadow-lg shadow-primary/20"
                >
                  <a
                    href="https://github.com/brmio/matter-js"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Открыть репозиторий Matter.js</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <TowerScene selectedModel={model} />
        </main>
      </div>
    </TooltipProvider>
  );
};

export default App;
