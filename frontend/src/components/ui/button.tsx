import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white focus-visible:ring-petflix-orange dark:focus-visible:ring-petflix-orange",
        destructive:
          "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white focus-visible:ring-red-500",
        outline:
          "border border-gray-300 dark:border-gray-600 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-petflix-gray focus-visible:ring-petflix-orange dark:focus-visible:ring-petflix-orange",
        secondary:
          "bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-petflix-gray/80 text-charcoal dark:text-white focus-visible:ring-petflix-orange dark:focus-visible:ring-petflix-orange",
        ghost: "hover:bg-gray-100 dark:hover:bg-petflix-gray text-charcoal dark:text-white focus-visible:ring-petflix-orange dark:focus-visible:ring-petflix-orange",
        link: "text-petflix-orange dark:text-petflix-orange underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
