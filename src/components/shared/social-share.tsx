'use client';

import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export function SocialShare({ url, title, description, className }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.error('Share failed:', err);
      }
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {/* Native share button (mobile) */}
        {hasNativeShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={share}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        )}

        {/* Social media buttons */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.open(shareUrls.twitter, '_blank')}
          title="Share on Twitter"
        >
          <Twitter className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => window.open(shareUrls.facebook, '_blank')}
          title="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => window.open(shareUrls.linkedin, '_blank')}
          title="Share on LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
        </Button>

        {/* Copy link button */}
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          title="Copy link"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <LinkIcon className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

