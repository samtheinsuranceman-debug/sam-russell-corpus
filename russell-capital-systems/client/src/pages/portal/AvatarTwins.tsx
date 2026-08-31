// @ts-nocheck
import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Camera,
  Upload,
  Sparkles,
  User,
  Heart,
  Crown,
  Loader2,
  RefreshCw,
  Palette,
  Wand2,
  Star,
  Zap,
  Shield,
  Gem,
  Flame,
  Eye,
} from "lucide-react";


const AVATAR_STYLES = [
  {
    id: "executive",
    name: "Executive Portrait",
    icon: Crown,
    description: "Polished corporate portrait with dramatic lighting",
    prompt: "Professional executive portrait painting, dramatic studio lighting, dark background, oil painting style, confident pose, luxury feel, photorealistic digital art",
    color: "from-amber-500 to-yellow-600",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Trader",
    icon: Zap,
    description: "Neon-lit futuristic financial warrior",
    prompt: "Cyberpunk portrait, neon lights, holographic displays, futuristic financial trader, digital art, glowing eyes, tech visor, dark background with neon accents",
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "fantasy",
    name: "Fantasy Wealth Mage",
    icon: Wand2,
    description: "Mystical wizard of wealth and prosperity",
    prompt: "Fantasy portrait, wealth mage, golden robes, magical aura, floating coins and gems, mystical background, epic fantasy art style, dramatic lighting",
    color: "from-purple-500 to-indigo-600",
  },
  {
    id: "warrior",
    name: "Financial Warrior",
    icon: Shield,
    description: "Armored champion of client portfolios",
    prompt: "Epic warrior portrait, golden armor, shield with dollar sign crest, dramatic battlefield background, heroic pose, cinematic lighting, digital painting",
    color: "from-red-500 to-orange-600",
  },
  {
    id: "royal",
    name: "Wealth Royalty",
    icon: Gem,
    description: "Regal portrait fit for financial nobility",
    prompt: "Royal portrait painting, crown, regal robes, throne room background, renaissance style, gold accents, majestic pose, classical oil painting technique",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "anime",
    name: "Anime Legend",
    icon: Star,
    description: "Anime-style protagonist of the financial world",
    prompt: "Anime portrait, protagonist style, determined expression, glowing aura, dynamic pose, financial theme, vibrant colors, high quality anime art",
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "fire",
    name: "Phoenix Rising",
    icon: Flame,
    description: "Emerging from flames of financial transformation",
    prompt: "Portrait emerging from phoenix flames, fiery background, golden fire, transformation theme, epic digital art, dramatic lighting, powerful expression",
    color: "from-orange-500 to-red-600",
  },
  {
    id: "minimal",
    name: "Clean Modern",
    icon: Eye,
    description: "Sleek, minimal, modern digital portrait",
    prompt: "Clean modern digital portrait, minimalist style, soft gradient background, professional look, contemporary art, smooth rendering, elegant simplicity",
    color: "from-gray-500 to-slate-600",
  },
];


export default function AvatarTwins() {
  const { user } = useAuth();
  const [myPhoto, setMyPhoto] = useState<File | null>(null);
  const [myPhotoPreview, setMyPhotoPreview] = useState<string | null>(null);
  const [spousePhoto, setSpousePhoto] = useState<File | null>(null);
  const [spousePhotoPreview, setSpousePhotoPreview] = useState<string | null>(null);
  const [spouseName, setSpouseName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>("executive");
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);
  const [spouseAvatarUrl, setSpouseAvatarUrl] = useState<string | null>(null);
  const [isGeneratingMy, setIsGeneratingMy] = useState(false);
  const [isGeneratingSpouse, setIsGeneratingSpouse] = useState(false);
  const [step, setStep] = useState<"upload" | "style" | "generate" | "result">("upload");

  const myFileRef = useRef<HTMLInputElement>(null);
  const spouseFileRef = useRef<HTMLInputElement>(null);

  const generateAvatarMutation = trpc.experience.generateAvatar.useMutation();

  const handleFileSelect = useCallback((file: File, who: "me" | "spouse") => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      if (who === "me") {
        setMyPhoto(file);
        setMyPhotoPreview(preview);
      } else {
        setSpousePhoto(file);
        setSpousePhotoPreview(preview);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUploadAndGenerate = async (who: "me" | "spouse") => {
    const photo = who === "me" ? myPhoto : spousePhoto;
    const preview = who === "me" ? myPhotoPreview : spousePhotoPreview;
    if (!photo || !preview) {
      toast.error("Please upload a photo first");
      return;
    }

    const setGenerating = who === "me" ? setIsGeneratingMy : setIsGeneratingSpouse;
    const setAvatarUrl = who === "me" ? setMyAvatarUrl : setSpouseAvatarUrl;
    setGenerating(true);

    try {
      const base64 = preview.split(",")[1];
      const styleMap: Record<string, "professional" | "warrior" | "mystic" | "futuristic" | "royal"> = {
        executive: "professional",
        cyberpunk: "futuristic",
        fantasy: "mystic",
        warrior: "warrior",
        royal: "royal",
        anime: "mystic",
        fire: "warrior",
        minimal: "professional",
      };

      const result = await generateAvatarMutation.mutateAsync({
        imageBase64: base64,
        style: styleMap[selectedStyle] || "professional",
        isSpouse: who === "spouse",
      });

      setAvatarUrl(result.avatarUrl);
      toast.success(`${who === "me" ? "Your" : `${spouseName || "Spouse's"}`} avatar is ready!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate avatar");
    } finally {
      setGenerating(false);
    }
  };

  const currentStyle = AVATAR_STYLES.find(s => s.id === selectedStyle)!;

  const renderUpload = () => (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-pink-500/20 border-2 border-amber-500/30 mb-4 relative">
          <Camera className="w-12 h-12 text-amber-400" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Avatar Twins</h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-lg">
          Upload your photo and your spouse's photo. Our AI will transform you both into 
          matching avatar portraits in any style you choose.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Photo */}
        <Card className="border-amber-500/20 hover:border-amber-500/40 transition-all">
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center gap-2">
              <User className="w-5 h-5 text-amber-400" /> Your Photo
            </CardTitle>
            <CardDescription>Upload a clear face photo</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <input
              ref={myFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], "me")}
            />
            {myPhotoPreview ? (
              <div className="relative inline-block">
                <img
                  src={myPhotoPreview}
                  alt="Your photo"
                  className="w-48 h-48 rounded-2xl object-cover border-2 border-amber-500/30 shadow-lg shadow-amber-500/10"
                />
                <button
                  onClick={() => { setMyPhoto(null); setMyPhotoPreview(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => myFileRef.current?.click()}
                className="w-48 h-48 rounded-2xl border-2 border-dashed border-amber-500/30 hover:border-amber-500/50 transition-all flex flex-col items-center justify-center gap-3 mx-auto hover:bg-amber-500/5"
              >
                <Upload className="w-8 h-8 text-amber-400" />
                <span className="text-sm text-muted-foreground">Click to upload</span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Spouse Photo */}
        <Card className="border-pink-500/20 hover:border-pink-500/40 transition-all">
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" /> Spouse's Photo
            </CardTitle>
            <CardDescription>Upload their face photo</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <input
              ref={spouseFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], "spouse")}
            />
            {spousePhotoPreview ? (
              <div className="relative inline-block">
                <img
                  src={spousePhotoPreview}
                  alt="Spouse photo"
                  className="w-48 h-48 rounded-2xl object-cover border-2 border-pink-500/30 shadow-lg shadow-pink-500/10"
                />
                <button
                  onClick={() => { setSpousePhoto(null); setSpousePhotoPreview(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => spouseFileRef.current?.click()}
                className="w-48 h-48 rounded-2xl border-2 border-dashed border-pink-500/30 hover:border-pink-500/50 transition-all flex flex-col items-center justify-center gap-3 mx-auto hover:bg-pink-500/5"
              >
                <Upload className="w-8 h-8 text-pink-400" />
                <span className="text-sm text-muted-foreground">Click to upload</span>
              </button>
            )}
            <Input
              placeholder="Spouse's name (optional)"
              value={spouseName}
              onChange={(e) => setSpouseName(e.target.value)}
              className="bg-background/50 max-w-xs mx-auto"
            />
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button
          onClick={() => setStep("style")}
          disabled={!myPhoto}
          size="lg"
          className="bg-gradient-to-r from-amber-600 to-pink-600 hover:from-amber-700 hover:to-pink-700 px-8"
        >
          Choose Your Style <Palette className="w-4 h-4 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          At minimum, upload your own photo. Spouse photo is optional.
        </p>
      </div>
    </div>
  );

  const renderStyleSelect = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Avatar Style</h2>
        <p className="text-muted-foreground">Pick the vibe. The AI will transform your photos into matching portraits.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AVATAR_STYLES.map((style) => {
          const Icon = style.icon;
          const isSelected = selectedStyle === style.id;
          return (
            <Card
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`cursor-pointer transition-all hover:scale-[1.02] ${
                isSelected ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30" : "border-border/30 hover:border-border/60"
              }`}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${style.color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">{style.name}</h3>
                <p className="text-xs text-muted-foreground">{style.description}</p>
                {isSelected && (
                  <Badge className="mt-2 bg-amber-500/20 text-amber-400 border-amber-500/30">Selected</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
        <Button
          onClick={() => setStep("generate")}
          size="lg"
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 px-8"
        >
          <Sparkles className="w-4 h-4 mr-2" /> Generate Avatars
        </Button>
      </div>
    </div>
  );

  const renderGenerate = () => (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Generate Your Avatar Twins</h2>
        <p className="text-muted-foreground">
          Style: <span className="text-amber-400 font-medium">{currentStyle.name}</span>. 
          Click to generate each avatar.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* My Avatar */}
        <Card className="border-amber-500/20">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg">Your Avatar</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {myAvatarUrl ? (
              <img src={myAvatarUrl} alt="Your avatar" className="w-64 h-64 rounded-2xl object-cover mx-auto border-2 border-amber-500/30 shadow-xl shadow-amber-500/20" />
            ) : myPhotoPreview ? (
              <div className="relative">
                <img src={myPhotoPreview} alt="Original" className="w-64 h-64 rounded-2xl object-cover mx-auto opacity-50 border border-border/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {isGeneratingMy ? (
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-amber-400 font-medium">Rendering...</p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleUploadAndGenerate("me")}
                      className="bg-gradient-to-r from-amber-600 to-orange-600"
                    >
                      <Wand2 className="w-4 h-4 mr-2" /> Transform
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No photo uploaded</p>
            )}

            {myAvatarUrl && (
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => { setMyAvatarUrl(null); handleUploadAndGenerate("me"); }}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spouse Avatar */}
        <Card className="border-pink-500/20">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg">{spouseName || "Spouse"}'s Avatar</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {spouseAvatarUrl ? (
              <img src={spouseAvatarUrl} alt="Spouse avatar" className="w-64 h-64 rounded-2xl object-cover mx-auto border-2 border-pink-500/30 shadow-xl shadow-pink-500/20" />
            ) : spousePhotoPreview ? (
              <div className="relative">
                <img src={spousePhotoPreview} alt="Original" className="w-64 h-64 rounded-2xl object-cover mx-auto opacity-50 border border-border/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {isGeneratingSpouse ? (
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 text-pink-400 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-pink-400 font-medium">Rendering...</p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleUploadAndGenerate("spouse")}
                      className="bg-gradient-to-r from-pink-600 to-rose-600"
                    >
                      <Wand2 className="w-4 h-4 mr-2" /> Transform
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-64 h-64 rounded-2xl border-2 border-dashed border-pink-500/20 flex items-center justify-center mx-auto">
                <p className="text-sm text-muted-foreground">No spouse photo uploaded</p>
              </div>
            )}

            {spouseAvatarUrl && (
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => { setSpouseAvatarUrl(null); handleUploadAndGenerate("spouse"); }}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Both generated → show result */}
      {(myAvatarUrl || spouseAvatarUrl) && (
        <div className="text-center">
          <Button
            onClick={() => setStep("result")}
            size="lg"
            className="bg-gradient-to-r from-amber-600 to-pink-600 hover:from-amber-700 hover:to-pink-700 px-8"
          >
            <Star className="w-4 h-4 mr-2" /> View Your Twin Portraits
          </Button>
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => setStep("style")}>Back to Styles</Button>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-pink-500/20 border-2 border-amber-500/30 mb-4">
          <Crown className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Your Avatar Twins</h2>
        <p className="text-muted-foreground text-lg">
          Style: <span className="text-amber-400">{currentStyle.name}</span>
        </p>
      </div>

      {/* Side by side display */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        {myAvatarUrl && (
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={myAvatarUrl}
                alt="Your avatar"
                className="w-72 h-72 rounded-3xl object-cover border-2 border-amber-500/40 shadow-2xl shadow-amber-500/20"
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-amber-500/90 text-white border-0 px-4 py-1 text-sm font-bold shadow-lg">
                  {user?.name || "You"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {myAvatarUrl && spouseAvatarUrl && (
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
        )}

        {spouseAvatarUrl && (
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={spouseAvatarUrl}
                alt="Spouse avatar"
                className="w-72 h-72 rounded-3xl object-cover border-2 border-pink-500/40 shadow-2xl shadow-pink-500/20"
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-pink-500/90 text-white border-0 px-4 py-1 text-sm font-bold shadow-lg">
                  {spouseName || "Spouse"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center pt-4">
        <Button variant="outline" onClick={() => setStep("style")}>
          <Palette className="w-4 h-4 mr-2" /> Try Different Style
        </Button>
        <Button variant="outline" onClick={() => setStep("generate")}>
          <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
        </Button>
        <Button
          className="bg-gradient-to-r from-amber-600 to-pink-600"
          onClick={() => {
            toast.success("Avatars set as your profile pictures!");
          }}
        >
          <User className="w-4 h-4 mr-2" /> Set as Profile Avatars
        </Button>
      </div>

      {/* Fun stats */}
      <Card className="border-amber-500/10 bg-gradient-to-r from-amber-500/5 to-pink-500/5">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Your avatars are now part of the Russell Capital universe</p>
          <div className="flex gap-6 justify-center">
            <div>
              <p className="text-2xl font-bold text-amber-400">+500</p>
              <p className="text-xs text-muted-foreground">XP Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">+250</p>
              <p className="text-xs text-muted-foreground">RussellCoin</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">1</p>
              <p className="text-xs text-muted-foreground">Achievement Unlocked</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/30 bg-gradient-to-r from-amber-500/5 via-background to-pink-500/5">
          <div className="container py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-pink-600 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Avatar Twins</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Portrait Generator for You & Your Spouse</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-8">
          {step === "upload" && renderUpload()}
          {step === "style" && renderStyleSelect()}
          {step === "generate" && renderGenerate()}
          {step === "result" && renderResult()}
        </div>
      </div>
    </AppShell>
  );
}
