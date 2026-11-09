import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import type { ComponentProps } from 'react';
import { cn } from './utils';

export function ScrollArea({ className, children, ...props }: ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn('relative overflow-hidden', className)} {...props}>
    <ScrollAreaPrimitive.Viewport data-slot="scroll-area-viewport" className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>;
}

export function ScrollBar({ className, orientation = 'vertical', ...props }: ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>) {
  return <ScrollAreaPrimitive.Scrollbar data-slot="scroll-area-scrollbar" orientation={orientation} className={cn('flex touch-none select-none p-px transition-colors', orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent', orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent', className)} {...props}>
    <ScrollAreaPrimitive.Thumb data-slot="scroll-area-thumb" className="relative flex-1 rounded-full bg-[#c9cbc5] hover:bg-[#9da097]" />
  </ScrollAreaPrimitive.Scrollbar>;
}
