import {
  Bodies,
  Body,
  Composite,
  Engine,
  Mouse,
  MouseConstraint,
  Render,
  Runner,
  World,
} from "matter-js";
import React from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RotateCcw, Sparkles } from "lucide-react";

const FLOOR_OFFSET = 60;

type TowerSceneProps = {
  selectedModel: string;
};

export const TowerScene: React.FC<TowerSceneProps> = ({ selectedModel }) => {
  const sceneRef = React.useRef<HTMLDivElement | null>(null);
  const engineRef = React.useRef<Engine | null>(null);
  const renderRef = React.useRef<Render | null>(null);
  const towerBodiesRef = React.useRef<Body[]>([]);
  const boundaryBodiesRef = React.useRef<Body[]>([]);
  const [isShimmering, setIsShimmering] = React.useState(false);
  const shimmeringRef = React.useRef(false);

  const getFillStyleForLevel = React.useCallback((level: number) => {
    return shimmeringRef.current
      ? `hsla(${220 + level * 0.6}, 95%, 65%, 0.9)`
      : `hsla(${215 + level * 0.35}, 75%, 62%, 0.95)`;
  }, []);

  const updateTowerAppearance = React.useCallback(() => {
    towerBodiesRef.current.forEach((body) => {
      const pluginData = (body.plugin as { towerLevel?: number } | undefined) ?? {};
      const level = pluginData.towerLevel ?? 0;
      body.render.fillStyle = getFillStyleForLevel(level);
    });
  }, [getFillStyleForLevel]);

  const buildTower = React.useCallback(() => {
    const engine = engineRef.current;
    const render = renderRef.current;

    if (!engine || !render) return;

    const world = engine.world;

    // remove old tower bodies
    if (towerBodiesRef.current.length) {
      towerBodiesRef.current.forEach((body) => Composite.remove(world, body, true));
      towerBodiesRef.current = [];
    }

    const width = render.options.width ?? render.canvas.width;
    const height = render.options.height ?? render.canvas.height;

    const effectiveWidth = width - 32;
    const baseY = height - FLOOR_OFFSET - 20;
    const boxSize = Math.max(12, Math.min(24, Math.round(width / 32)));
    const levelHeight = boxSize * 0.9;
    const totalLevels = Math.floor((height * 0.7) / levelHeight);

    const boxes: Body[] = [];

    for (let level = 0; level < totalLevels; level += 1) {
      const progress = level / totalLevels;
      let widthFactor = 1 - progress * 0.75;

      if (progress > 0.3 && progress <= 0.6) {
        widthFactor = 0.6 - (progress - 0.3) * 0.5;
      } else if (progress > 0.6) {
        widthFactor = 0.35 - (progress - 0.6) * 0.35;
      }

      widthFactor = Math.max(0.12, widthFactor);

      const levelWidth = effectiveWidth * widthFactor;
      const columns = Math.max(2, Math.floor(levelWidth / boxSize));
      const offsetX = (width - columns * boxSize) / 2;
      const y = baseY - level * levelHeight;

      for (let column = 0; column < columns; column += 1) {
        const x = offsetX + column * boxSize + boxSize / 2;

        // carve out the signature arches
        const archThreshold = totalLevels * 0.12;
        const midArchTop = totalLevels * 0.28;
        const shouldSkip =
          level < archThreshold && (column > 1 && column < columns - 2);

        const shouldCreateLattice =
          level > archThreshold &&
          level < midArchTop &&
          column % 2 === (level % 2);

        if (shouldSkip) {
          continue;
        }

        if (shouldCreateLattice) {
          continue;
        }

        const body = Bodies.rectangle(x, y, boxSize * 0.9, boxSize * 0.9, {
          chamfer: { radius: 3 },
          friction: 0.4,
          frictionAir: 0.015,
          restitution: 0.05,
          render: {
            fillStyle: getFillStyleForLevel(level),
          },
        });

        const pluginData = (body.plugin ?? {}) as { towerLevel?: number };
        pluginData.towerLevel = level;
        body.plugin = pluginData;

        boxes.push(body);
      }
    }

    boxes.forEach((body) => World.add(world, body));
    towerBodiesRef.current = boxes;
    updateTowerAppearance();
  }, [getFillStyleForLevel, updateTowerAppearance]);

  const handleReset = React.useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.world.gravity.y = 1;
    buildTower();
  }, [buildTower]);

  React.useEffect(() => {
    const container = sceneRef.current;
    if (!container) return;

    const engine = Engine.create({
      gravity: { x: 0, y: 1, scale: 0.001 },
    });
    engineRef.current = engine;

    const width = container.clientWidth;
    const height = Math.max(container.clientHeight, 520);

    const render = Render.create({
      element: container,
      engine,
      options: {
        width,
        height,
        pixelRatio: Math.min(2, window.devicePixelRatio || 1),
        wireframes: false,
        background: "transparent",
      },
    });

    renderRef.current = render;

    const runner = Runner.create();
    Render.run(render);
    Runner.run(runner, engine);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.14,
        damping: 0.2,
      },
    });

    World.add(engine.world, mouseConstraint);
    (render as Render & { mouse: Mouse }).mouse = mouse;

    const floor = Bodies.rectangle(width / 2, height, width * 1.4, 80, {
      isStatic: true,
      friction: 0.9,
      render: { fillStyle: "transparent" },
    });

    const leftWall = Bodies.rectangle(-40, height / 2, 80, height * 1.2, {
      isStatic: true,
      render: { fillStyle: "transparent" },
    });

    const rightWall = Bodies.rectangle(width + 40, height / 2, 80, height * 1.2, {
      isStatic: true,
      render: { fillStyle: "transparent" },
    });

    boundaryBodiesRef.current = [floor, leftWall, rightWall];
    boundaryBodiesRef.current.forEach((body) => World.add(engine.world, body));

    buildTower();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const contentRect = entry.contentRect;
        const nextWidth = Math.floor(contentRect.width);
        const nextHeight = Math.floor(Math.max(contentRect.height, 520));

        render.options.width = nextWidth;
        render.options.height = nextHeight;
        render.canvas.width = nextWidth * (render.options.pixelRatio ?? 1);
        render.canvas.height = nextHeight * (render.options.pixelRatio ?? 1);
        render.canvas.style.width = `${nextWidth}px`;
        render.canvas.style.height = `${nextHeight}px`;

        boundaryBodiesRef.current.forEach((body) => World.remove(engine.world, body));

        const nextFloor = Bodies.rectangle(nextWidth / 2, nextHeight, nextWidth * 1.4, 80, {
          isStatic: true,
          friction: 0.9,
          render: { fillStyle: "transparent" },
        });
        const nextLeft = Bodies.rectangle(-40, nextHeight / 2, 80, nextHeight * 1.2, {
          isStatic: true,
          render: { fillStyle: "transparent" },
        });
        const nextRight = Bodies.rectangle(nextWidth + 40, nextHeight / 2, 80, nextHeight * 1.2, {
          isStatic: true,
          render: { fillStyle: "transparent" },
        });

        boundaryBodiesRef.current = [nextFloor, nextLeft, nextRight];

        boundaryBodiesRef.current.forEach((body) => World.add(engine.world, body));

        buildTower();
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world, false);
      towerBodiesRef.current = [];
      boundaryBodiesRef.current = [];
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {} as typeof render.textures;
    };
  }, [buildTower]);

  React.useEffect(() => {
    // change shimmering effect to celebrate model selection
    shimmeringRef.current = true;
    setIsShimmering(true);
    updateTowerAppearance();

    const shimmerTimeout = window.setTimeout(() => {
      shimmeringRef.current = false;
      setIsShimmering(false);
      updateTowerAppearance();
    }, 1200);

    return () => window.clearTimeout(shimmerTimeout);
  }, [selectedModel, updateTowerAppearance]);

  React.useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const shake = () => {
      towerBodiesRef.current.forEach((body, index) => {
        const magnitude = 0.005 + (index % 5) * 0.0004;
        Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * magnitude,
          y: -magnitude * 0.6,
        });
      });
    };

    if (!isShimmering) return;

    const interval = window.setInterval(shake, 120);
    return () => window.clearInterval(interval);
  }, [isShimmering]);

  return (
    <div className="relative flex h-full flex-1 flex-col">
      <div ref={sceneRef} className="relative h-[70vh] min-h-[520px] w-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-background/60 to-background/10 shadow-lg backdrop-blur">
        {/* Canvas injected by Matter.js */}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={handleReset} aria-label="Reset tower">
                <RotateCcw className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Собрать заново</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setIsShimmering((prev) => {
                    const next = !prev;
                    shimmeringRef.current = next;
                    updateTowerAppearance();
                    return next;
                  })
                }
                aria-label="Toggle shimmer"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Подсветить башню</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
