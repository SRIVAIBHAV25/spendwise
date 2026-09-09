import { Button, Dialog } from 'heroui-native';
import { View } from 'react-native';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Two-choice confirmation used before destructive actions. Built on HeroUI
 * Dialog rather than `Alert` so it behaves identically on iOS, Android and web.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay isCloseOnPress />
        <Dialog.Content className="gap-1">
          <Dialog.Title>{title}</Dialog.Title>
          {description ? <Dialog.Description>{description}</Dialog.Description> : null}
          <View className="mt-5 flex-row gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => onOpenChange(false)}
              accessibilityLabel={cancelLabel}
            >
              <Button.Label>{cancelLabel}</Button.Label>
            </Button>
            <Button
              variant={tone === 'danger' ? 'danger' : 'primary'}
              className="flex-1"
              onPress={() => {
                onOpenChange(false);
                onConfirm();
              }}
              accessibilityLabel={confirmLabel}
            >
              <Button.Label>{confirmLabel}</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
