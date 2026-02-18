import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '@/components/ui/Avatar';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { formatRelativeTime } from '@/utils/format';

interface CommentAuthor {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  role?: string;
}

interface Comment {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author: CommentAuthor;
}

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string, isInternal: boolean) => void;
  loading?: boolean;
  showInternalToggle?: boolean;
}

function CommentBubble({ comment }: { comment: Comment }) {
  const authorName = `${comment.author.first_name} ${comment.author.last_name}`;
  const avatarSource = comment.author.avatar_url
    ? { uri: comment.author.avatar_url }
    : null;

  return (
    <View
      style={[
        styles.commentBubble,
        comment.is_internal && styles.commentBubbleInternal,
      ]}
    >
      <View style={styles.commentHeader}>
        <Avatar source={avatarSource} name={authorName} size="sm" />
        <View style={styles.commentMeta}>
          <View style={styles.authorRow}>
            <Text style={styles.authorName}>{authorName}</Text>
            {comment.is_internal && (
              <View style={styles.internalBadge}>
                <Ionicons name="lock-closed" size={10} color={colors.warning.dark} />
                <Text style={styles.internalBadgeText}>Internal</Text>
              </View>
            )}
          </View>
          <Text style={styles.commentTime}>
            {formatRelativeTime(comment.created_at)}
          </Text>
        </View>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
    </View>
  );
}

export function CommentThread({
  comments,
  onAddComment,
  loading = false,
  showInternalToggle = false,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;

    onAddComment(trimmed, isInternal);
    setNewComment('');
  };

  return (
    <View style={styles.container}>
      {/* Comment list */}
      {comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={32} color={colors.grey[400]} />
          <Text style={styles.emptyText}>No comments yet.</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommentBubble comment={item} />}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      )}

      {/* Add comment form */}
      <View style={styles.inputContainer}>
        {showInternalToggle && (
          <Pressable
            style={[
              styles.internalToggle,
              isInternal && styles.internalToggleActive,
            ]}
            onPress={() => setIsInternal((prev) => !prev)}
          >
            <Ionicons
              name={isInternal ? 'lock-closed' : 'lock-open-outline'}
              size={16}
              color={isInternal ? colors.warning.dark : colors.grey[500]}
            />
            <Text
              style={[
                styles.internalToggleText,
                isInternal && styles.internalToggleTextActive,
              ]}
            >
              {isInternal ? 'Internal' : 'Public'}
            </Text>
          </Pressable>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Write a comment..."
            placeholderTextColor={colors.text.disabled}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[
              styles.sendButton,
              !newComment.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!newComment.trim() || loading}
          >
            <Ionicons
              name="send"
              size={20}
              color={newComment.trim() ? colors.white : colors.grey[400]}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    gap: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  commentBubble: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  commentBubbleInternal: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning.main,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  commentMeta: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  internalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  internalBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.warning.dark,
  },
  commentTime: {
    fontSize: fontSize.xs,
    color: colors.grey[500],
    marginTop: 1,
  },
  commentContent: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    lineHeight: 20,
  },
  inputContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  internalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grey[100],
  },
  internalToggleActive: {
    backgroundColor: '#FFF3E0',
  },
  internalToggleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.grey[600],
  },
  internalToggleTextActive: {
    color: colors.warning.dark,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.primary,
    backgroundColor: colors.white,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.grey[200],
  },
});
