import { Button, Dialog, Input, Label, Text, TextField } from 'heroui-native';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { COLOR_CHOICES, getCategoryIcon, ICON_CHOICES } from '@/lib/catalog';
import { useSettingsStore } from '@/lib/stores/settings';
import { showToast } from '@/lib/stores/toast';
import { useAppColors, withAlpha } from '@/lib/theme';
import type { Category } from '@/lib/types';

interface EditorState {
  id: string | null;
  name: string;
  icon: string;
  color: string;
}

const BLANK: EditorState = {
  id: null,
  name: '',
  icon: ICON_CHOICES[0] ?? 'more',
  color: COLOR_CHOICES[0] ?? '#F97316',
};

export default function CategorySettingsScreen() {
  const colors = useAppColors();
  const categories = useSettingsStore((state) => state.categories);
  const addCategory = useSettingsStore((state) => state.addCategory);
  const updateCategory = useSettingsStore((state) => state.updateCategory);
  const removeCategory = useSettingsStore((state) => state.removeCategory);
  const resetCategories = useSettingsStore((state) => state.resetCategories);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const openEditor = (category?: Category) => {
    setNameError(null);
    setEditor(
      category
        ? { id: category.id, name: category.name, icon: category.icon, color: category.color }
        : BLANK,
    );
  };

  const save = () => {
    if (!editor) return;
    const name = editor.name.trim();
    if (!name) {
      setNameError('Give the category a name');
      return;
    }
    const duplicate = categories.some(
      (category) => category.name.toLowerCase() === name.toLowerCase() && category.id !== editor.id,
    );
    if (duplicate) {
      setNameError('You already have a category with that name');
      return;
    }

    if (editor.id) {
      updateCategory(editor.id, { name, icon: editor.icon, color: editor.color });
      showToast('Category updated');
    } else {
      addCategory({ name, icon: editor.icon, color: editor.color });
      showToast('Category added');
    }
    setEditor(null);
  };

  return (
    <View className="bg-background pt-safe flex-1">
      <ScreenHeader
        title="Categories"
        subtitle={`${categories.length} in use`}
        backFallback="/(tabs)/settings"
        right={
          <Pressable
            onPress={() => openEditor()}
            accessibilityRole="button"
            accessibilityLabel="Add category"
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: withAlpha(colors.accent, 0.14) }}
          >
            <Plus color={colors.accent} size={22} />
          </Pressable>
        }
      />

      <ScrollView contentContainerClassName="px-5 pb-10 gap-3" showsVerticalScrollIndicator={false}>
        <View className="border-border bg-surface overflow-hidden rounded-3xl border">
          {categories.map((category, index) => {
            const Icon = getCategoryIcon(category.icon);
            return (
              <View key={category.id}>
                {index > 0 ? <View className="bg-border h-px" /> : null}
                <View className="flex-row items-center gap-3 px-4 py-3">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: withAlpha(category.color, 0.16) }}
                  >
                    <Icon color={category.color} size={19} />
                  </View>
                  <View className="flex-1">
                    <Text type="body" weight="medium">
                      {category.name}
                    </Text>
                    {category.isDefault ? (
                      <Text type="body-xs" color="muted">
                        Default category
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => openEditor(category)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${category.name}`}
                    hitSlop={6}
                    className="active:bg-surface-secondary h-10 w-10 items-center justify-center rounded-full"
                  >
                    <Pencil color={colors.muted} size={17} />
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingDelete(category)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${category.name}`}
                    hitSlop={6}
                    className="active:bg-surface-secondary h-10 w-10 items-center justify-center rounded-full"
                  >
                    <Trash2 color={colors.danger} size={17} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <Button variant="secondary" className="h-12" onPress={() => openEditor()}>
          <Plus color={colors.foreground} size={18} />
          <Button.Label>Add category</Button.Label>
        </Button>

        <Button
          variant="ghost"
          className="h-11"
          onPress={() => setIsResetOpen(true)}
          accessibilityLabel="Reset to default categories"
        >
          <RotateCcw color={colors.muted} size={16} />
          <Button.Label>Reset to defaults</Button.Label>
        </Button>

        <Text type="body-xs" color="muted" className="px-1">
          Deleting a category never deletes expenses. Past transactions keep the name they were
          saved with.
        </Text>
      </ScrollView>

      <Dialog
        isOpen={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay isCloseOnPress />
          <Dialog.Content className="max-h-[92%] w-full max-w-[420px]">
            <Dialog.Title>{editor?.id ? 'Edit category' : 'New category'}</Dialog.Title>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView
                className="mt-3"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="gap-4 pb-1"
              >
                <TextField isInvalid={Boolean(nameError)}>
                  <Label>Name</Label>
                  <Input
                    value={editor?.name ?? ''}
                    onChangeText={(value) => {
                      setNameError(null);
                      setEditor((current) => (current ? { ...current, name: value } : current));
                    }}
                    placeholder="Rent, Fuel, Subscriptions…"
                    maxLength={24}
                    accessibilityLabel="Category name"
                  />
                  {nameError ? (
                    <Text type="body-xs" style={{ color: colors.danger }}>
                      {nameError}
                    </Text>
                  ) : null}
                </TextField>

                <View>
                  <SectionHeader title="Icon" />
                  <View className="-mx-1 mt-2 flex-row flex-wrap">
                    {ICON_CHOICES.map((iconKey) => {
                      const Icon = getCategoryIcon(iconKey);
                      const selected = editor?.icon === iconKey;
                      return (
                        <View key={iconKey} className="p-1">
                          <Pressable
                            onPress={() =>
                              setEditor((current) =>
                                current ? { ...current, icon: iconKey } : current,
                              )
                            }
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            accessibilityLabel={`Icon ${iconKey}`}
                            className="h-11 w-11 items-center justify-center rounded-2xl border"
                            style={{
                              borderColor: selected
                                ? (editor?.color ?? colors.accent)
                                : colors.border,
                              backgroundColor: selected
                                ? withAlpha(editor?.color ?? colors.accent, 0.16)
                                : colors.surface,
                            }}
                          >
                            <Icon
                              color={selected ? (editor?.color ?? colors.accent) : colors.muted}
                              size={19}
                            />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <SectionHeader title="Color" />
                  <View className="-mx-1 mt-2 flex-row flex-wrap">
                    {COLOR_CHOICES.map((color) => {
                      const selected = editor?.color === color;
                      return (
                        <View key={color} className="p-1">
                          <Pressable
                            onPress={() =>
                              setEditor((current) => (current ? { ...current, color } : current))
                            }
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            accessibilityLabel={`Color ${color}`}
                            className="h-11 w-11 items-center justify-center rounded-full border-2"
                            style={{ borderColor: selected ? colors.foreground : 'transparent' }}
                          >
                            <View
                              className="h-8 w-8 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>

            <View className="mt-4 flex-row gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onPress={() => setEditor(null)}
                accessibilityLabel="Cancel"
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button className="flex-1" onPress={save} accessibilityLabel="Save category">
                <Button.Label>{editor?.id ? 'Save' : 'Add'}</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={pendingDelete ? `Delete “${pendingDelete.name}”?` : 'Delete category?'}
        description="Existing expenses keep this category name, but it will no longer be offered when adding an expense."
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeCategory(pendingDelete.id);
          setPendingDelete(null);
          showToast('Category deleted');
        }}
      />

      <ConfirmDialog
        isOpen={isResetOpen}
        title="Reset to default categories?"
        description="Custom categories will be removed. Your expenses are not affected."
        confirmLabel="Reset"
        onOpenChange={setIsResetOpen}
        onConfirm={() => {
          resetCategories();
          showToast('Categories reset');
        }}
      />

      {categories.length === 0 ? (
        <View className="absolute inset-x-5 bottom-24">
          <Text type="body-sm" color="muted" align="center">
            Add at least one category so you can record expenses.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
