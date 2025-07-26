import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Accessibility, RotateCcw, Eye, Type, Zap, Focus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-labelledby="accessibility-title"
      aria-modal="true"
    >
      <Card 
        className="w-full max-w-md bg-white dark:bg-gray-900 border shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <CardHeader className="pb-3">
          <CardTitle 
            id="accessibility-title" 
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Accessibility className="w-5 h-5" aria-hidden="true" />
            Accessibility Settings
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* High Contrast */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="high-contrast" 
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                High Contrast Mode
              </Label>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                aria-describedby="high-contrast-desc"
              />
            </div>
            <p id="high-contrast-desc" className="text-xs text-gray-600 dark:text-gray-400">
              Increases contrast between text and background
            </p>
          </div>

          <Separator />

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Type className="w-4 h-4" aria-hidden="true" />
              Font Size
            </Label>
            <Select
              value={settings.fontSize}
              onValueChange={(value: typeof settings.fontSize) => updateSetting('fontSize', value)}
            >
              <SelectTrigger aria-describedby="font-size-desc">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="large">Large (120%)</SelectItem>
                <SelectItem value="extra-large">Extra Large (150%)</SelectItem>
              </SelectContent>
            </Select>
            <p id="font-size-desc" className="text-xs text-gray-600 dark:text-gray-400">
              Adjusts text size throughout the application
            </p>
          </div>

          <Separator />

          {/* Reduced Motion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="reduced-motion" 
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Zap className="w-4 h-4" aria-hidden="true" />
                Reduce Motion
              </Label>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                aria-describedby="reduced-motion-desc"
              />
            </div>
            <p id="reduced-motion-desc" className="text-xs text-gray-600 dark:text-gray-400">
              Minimizes animations and transitions
            </p>
          </div>

          <Separator />

          {/* Enhanced Focus */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="focus-indicators" 
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Focus className="w-4 h-4" aria-hidden="true" />
                Enhanced Focus
              </Label>
              <Switch
                id="focus-indicators"
                checked={settings.focusIndicators}
                onCheckedChange={(checked) => updateSetting('focusIndicators', checked)}
                aria-describedby="focus-indicators-desc"
              />
            </div>
            <p id="focus-indicators-desc" className="text-xs text-gray-600 dark:text-gray-400">
              Shows stronger focus indicators for keyboard navigation
            </p>
          </div>

          <Separator />

          {/* Screen Reader Optimization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="screen-reader" 
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Accessibility className="w-4 h-4" aria-hidden="true" />
                Screen Reader Mode
              </Label>
              <Switch
                id="screen-reader"
                checked={settings.screenReaderOptimized}
                onCheckedChange={(checked) => updateSetting('screenReaderOptimized', checked)}
                aria-describedby="screen-reader-desc"
              />
            </div>
            <p id="screen-reader-desc" className="text-xs text-gray-600 dark:text-gray-400">
              Optimizes interface for screen reader users
            </p>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetSettings}
              className="flex items-center gap-2 flex-1"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}