import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, LogOut, Download, Save, Plus, Trash2 } from "lucide-react";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

interface ParticipantRow {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  points: number;
  age: number | null;
  grade_level: string | null;
  school: string | null;
  program: string | null;
  created_at: string;
}

interface LocationRow {
  id: number;
  name: string;
  lat: number;
  lng: number;
  points: number;
}

interface PrizeRow {
  id: string;
  name: string;
  weight: number;
  created_at?: string;
}

interface DashboardResponse {
  ok: boolean;
  participants: ParticipantRow[];
  locations: LocationRow[];
  prizes: PrizeRow[];
  settings: {
    pointsRequiredForWheel: number;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [locationDrafts, setLocationDrafts] = useState<LocationRow[]>([]);
  const [prizeDrafts, setPrizeDrafts] = useState<PrizeRow[]>([]);
  const [pointsRequired, setPointsRequired] = useState<number>(300);
  const [savingLocationId, setSavingLocationId] = useState<number | null>(null);
  const [savingPrizeId, setSavingPrizeId] = useState<string | null>(null);
  const [newPrize, setNewPrize] = useState({ name: "", weight: "10" });
  const [updatingThreshold, setUpdatingThreshold] = useState(false);

  const adminUsername = useMemo(() => localStorage.getItem("adminUsername") ?? "admin", []);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("authRole");
    toast({ title: "Signed out", description: "Admin session closed." });
    navigate("/login");
  }, [navigate, toast]);

  const fetchDashboard = useCallback(async (sessionToken: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<DashboardResponse>("admin", {
        body: {
          token: sessionToken,
          action: "get-dashboard-data",
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.ok) {
        throw new Error("Unexpected dashboard response.");
      }

      setDashboard(data);
      setLocationDrafts(data.locations.map((loc) => ({ ...loc })));
      setPrizeDrafts(data.prizes.map((prize) => ({ ...prize })));
      setPointsRequired(data.settings.pointsRequiredForWheel);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({
        title: "Unable to load dashboard",
        description: message,
        variant: "destructive",
      });

      if (message.toLowerCase().includes("session")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout, toast]);

  useEffect(() => {
    const sessionToken = localStorage.getItem("adminToken");
    if (!sessionToken) {
      navigate("/login");
      return;
    }

    setToken(sessionToken);
    fetchDashboard(sessionToken);
  }, [navigate, fetchDashboard]);

  const handleLocationChange = (index: number, field: keyof LocationRow, value: string) => {
    setLocationDrafts((prev) => {
      const updated = [...prev];
      const current = { ...updated[index] };
      if (field === "points" || field === "lat" || field === "lng") {
        const numberValue = value === "" ? NaN : Number(value);
        current[field] = numberValue;
      } else {
        current[field] = value as never;
      }
      updated[index] = current;
      return updated;
    });
  };

  const saveLocation = async (location: LocationRow) => {
    if (!token) {
      return;
    }
    if (
      Number.isNaN(location.lat) ||
      Number.isNaN(location.lng) ||
      Number.isNaN(location.points)
    ) {
      toast({
        title: "Invalid location data",
        description: "Latitude, longitude and points must be valid numbers.",
        variant: "destructive",
      });
      return;
    }

    setSavingLocationId(location.id);
    try {
      const { error } = await supabase.functions.invoke("admin", {
        body: {
          token,
          action: "update-location",
          payload: {
            id: location.id,
            name: location.name.trim(),
            lat: Number(location.lat),
            lng: Number(location.lng),
            points: Number(location.points),
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({ title: "Location updated" });
      fetchDashboard(token);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({
        title: "Failed to update location",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingLocationId(null);
    }
  };

  const savePrize = async (prize: PrizeRow) => {
    if (!token) {
      return;
    }

    if (prize.name.trim().length === 0 || prize.weight <= 0) {
      toast({
        title: "Invalid prize",
        description: "Provide a name and a weight greater than zero.",
        variant: "destructive",
      });
      return;
    }

    setSavingPrizeId(prize.id);
    try {
      const { error } = await supabase.functions.invoke("admin", {
        body: {
          token,
          action: "update-prize",
          payload: {
            id: prize.id,
            name: prize.name.trim(),
            weight: Number(prize.weight),
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({ title: "Prize updated" });
      fetchDashboard(token);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({
        title: "Failed to update prize",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingPrizeId(null);
    }
  };

  const deletePrize = async (id: string) => {
    if (!token) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("admin", {
        body: {
          token,
          action: "delete-prize",
          payload: { id },
        },
      });

      if (error) {
        throw error;
      }

      toast({ title: "Prize removed" });
      fetchDashboard(token);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({
        title: "Failed to remove prize",
        description: message,
        variant: "destructive",
      });
    }
  };

  const addPrize = async () => {
    if (!token) {
      return;
    }

    const trimmedName = newPrize.name.trim();
    const weightValue = Number(newPrize.weight);

    if (!trimmedName || Number.isNaN(weightValue) || weightValue <= 0) {
      toast({
        title: "Invalid prize details",
        description: "Add a title and a positive weight.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("admin", {
        body: {
          token,
          action: "create-prize",
          payload: {
            name: trimmedName,
            weight: weightValue,
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({ title: "Prize added" });
      setNewPrize({ name: "", weight: "10" });
      fetchDashboard(token);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({
        title: "Failed to add prize",
        description: message,
        variant: "destructive",
      });
    }
  };

  const updateThreshold = async () => {
    if (!token) {
      return;
    }

    if (Number.isNaN(pointsRequired) || pointsRequired < 0) {
      toast({
        title: "Invalid threshold",
        description: "Points must be zero or a positive number.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingThreshold(true);
    try {
      const { error } = await supabase.functions.invoke("admin", {
        body: {
          token,
          action: "set-spin-threshold",
          payload: {
            pointsRequired: Number(pointsRequired),
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({ title: "Spin threshold updated" });
      fetchDashboard(token);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({
        title: "Failed to update threshold",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUpdatingThreshold(false);
    }
  };

  const exportParticipants = () => {
    if (!dashboard) {
      return;
    }

    const header = [
      "Participant ID",
      "Username",
      "First Name",
      "Last Name",
      "Points",
      "Age",
      "Grade",
      "School",
      "Program",
      "Registered At",
    ];

    const rows = dashboard.participants.map((p) => [
      p.id,
      p.username,
      p.first_name,
      p.last_name,
      String(p.points),
      p.age ? String(p.age) : "",
      p.grade_level ?? "",
      p.school ?? "",
      p.program ?? "",
      new Date(p.created_at).toISOString(),
    ]);

    const csvContent = [header, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const sanitized = value.replace(/"/g, '""');
            return `"${sanitized}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `participants_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="container mx-auto space-y-8 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary">Admin dashboard</h1>
            <p className="text-muted-foreground">
              Manage locations, prizes, and export registered participants.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">Signed in as {adminUsername}</Badge>
            <Button variant="secondary" onClick={() => fetchDashboard(token)} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>

        {loading && (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Loading dashboard data...
            </CardContent>
          </Card>
        )}

        {!loading && dashboard && (
          <Tabs defaultValue="participants" className="space-y-6">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="prizes">Prizes</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="participants" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Registered participants</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Total members: {dashboard.participants.length}
                    </p>
                  </div>
                  <Button onClick={exportParticipants}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.participants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell className="font-medium">{participant.username}</TableCell>
                          <TableCell>
                            {participant.first_name} {participant.last_name}
                          </TableCell>
                          <TableCell>{participant.points}</TableCell>
                          <TableCell>{participant.school ?? "—"}</TableCell>
                          <TableCell>{participant.program ?? "—"}</TableCell>
                          <TableCell>
                            {new Date(participant.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manage locations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {locationDrafts.map((location, index) => (
                    <div
                      key={location.id}
                      className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-2"
                    >
                      <div className="space-y-2">
                        <Label htmlFor={`loc-name-${location.id}`}>Name</Label>
                        <Input
                          id={`loc-name-${location.id}`}
                          value={location.name}
                          onChange={(event) =>
                            handleLocationChange(index, "name", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`loc-points-${location.id}`}>Points</Label>
                        <Input
                          id={`loc-points-${location.id}`}
                          type="number"
                          value={location.points}
                          onChange={(event) =>
                            handleLocationChange(index, "points", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`loc-lat-${location.id}`}>Latitude</Label>
                        <Input
                          id={`loc-lat-${location.id}`}
                          type="number"
                          value={location.lat}
                          onChange={(event) =>
                            handleLocationChange(index, "lat", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`loc-lng-${location.id}`}>Longitude</Label>
                        <Input
                          id={`loc-lng-${location.id}`}
                          type="number"
                          value={location.lng}
                          onChange={(event) =>
                            handleLocationChange(index, "lng", event.target.value)
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Button
                          onClick={() => saveLocation(location)}
                          disabled={savingLocationId === location.id}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {savingLocationId === location.id ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prizes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Prize catalog</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6">
                    {prizeDrafts.map((prize, index) => (
                      <div
                        key={prize.id}
                        className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-[1fr_auto]"
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`prize-name-${prize.id}`}>Prize name</Label>
                          <Input
                            id={`prize-name-${prize.id}`}
                            value={prize.name}
                            onChange={(event) =>
                              setPrizeDrafts((prev) => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], name: event.target.value };
                                return updated;
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`prize-weight-${prize.id}`}>Weight</Label>
                          <Input
                            id={`prize-weight-${prize.id}`}
                            type="number"
                            value={prize.weight}
                            onChange={(event) =>
                              setPrizeDrafts((prev) => {
                                const updated = [...prev];
                                updated[index] = {
                                  ...updated[index],
                                  weight: Number(event.target.value),
                                };
                                return updated;
                              })
                            }
                          />
                        </div>

                        <div className="flex gap-2 md:col-span-2">
                          <Button
                            onClick={() => savePrize(prize)}
                            disabled={savingPrizeId === prize.id}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {savingPrizeId === prize.id ? "Saving..." : "Save prize"}
                          </Button>
                          <Button variant="outline" onClick={() => deletePrize(prize.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-dashed border-border p-4 space-y-4">
                    <h3 className="text-lg font-semibold">Add a new prize</h3>
                    <div className="grid gap-4 md:grid-cols-[2fr_1fr_auto]">
                      <Input
                        placeholder="Prize name"
                        value={newPrize.name}
                        onChange={(event) =>
                          setNewPrize((prev) => ({ ...prev, name: event.target.value }))
                        }
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Weight"
                        value={newPrize.weight}
                        onChange={(event) =>
                          setNewPrize((prev) => ({ ...prev, weight: event.target.value }))
                        }
                      />
                      <Button onClick={addPrize}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add prize
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Reward configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="points-required">Points needed to spin</Label>
                    <Input
                      id="points-required"
                      type="number"
                      min="0"
                      value={pointsRequired}
                      onChange={(event) => setPointsRequired(Number(event.target.value))}
                    />
                  </div>
                  <Button onClick={updateThreshold} disabled={updatingThreshold}>
                    <Save className="w-4 h-4 mr-2" />
                    {updatingThreshold ? "Saving..." : "Save threshold"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
