import React, { useState } from 'react';
import { usePreferences } from "@/context/PreferencesContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Building2, 
  Users, 
  Bell,
  X,
  Plus,
  Save,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Preferences = () => {
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const { toast } = useToast();
  const [newSkill, setNewSkill] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Predefined options
  const jobCategories = [
    'Software Development',
    'Data Science & AI',
    'Marketing & Sales',
    'Design & Creative',
    'Product Management',
    'Engineering',
    'Finance',
    'Healthcare',
    'Education',
    'Customer Service'
  ];

  const popularLocations = [
    'Bangalore, India',
    'Mumbai, India',
    'Delhi, India',
    'Hyderabad, India',
    'Chennai, India',
    'Pune, India',
    'Remote',
    'New York, USA',
    'San Francisco, USA',
    'London, UK'
  ];

  const jobTypes = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' }
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (2-5 years)' },
    { value: 'senior', label: 'Senior Level (5-10 years)' },
    { value: 'executive', label: 'Executive (10+ years)' }
  ];

  const companySizes = [
    { value: 'startup', label: 'Startup (1-50 employees)' },
    { value: 'small', label: 'Small (51-200 employees)' },
    { value: 'medium', label: 'Medium (201-1000 employees)' },
    { value: 'large', label: 'Large (1001-5000 employees)' },
    { value: 'enterprise', label: 'Enterprise (5000+ employees)' }
  ];

  const workArrangements = [
    { value: 'onsite', label: 'On-site' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'remote', label: 'Remote' }
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'E-commerce',
    'Manufacturing',
    'Consulting',
    'Media & Entertainment',
    'Non-profit',
    'Government'
  ];

  const handleArrayToggle = (array: string[], value: string, key: keyof typeof preferences) => {
    const newArray = array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
    updatePreferences({ [key]: newArray });
  };

  const handleAddItem = (value: string, key: keyof typeof preferences, setValue: (val: string) => void) => {
    if (value.trim() && !(preferences[key] as string[]).includes(value.trim())) {
      updatePreferences({
        [key]: [...(preferences[key] as string[]), value.trim()]
      });
      setValue('');
    }
  };

  const handleRemoveItem = (item: string, key: keyof typeof preferences) => {
    updatePreferences({
      [key]: (preferences[key] as string[]).filter(i => i !== item)
    });
  };

  const handleSave = () => {
    toast({
      title: "Preferences Saved",
      description: "Your job preferences have been updated successfully.",
    });
  };

  const handleReset = () => {
    resetPreferences();
    toast({
      title: "Preferences Reset",
      description: "Your preferences have been reset to default values.",
    });
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Job Preferences
              </h1>
              <p className="text-muted-foreground">
                Set your preferences to get personalized job recommendations
              </p>
            </div>

            <Tabs defaultValue="categories" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="salary">Salary</TabsTrigger>
                <TabsTrigger value="job-details">Job Details</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>

              {/* Job Categories */}
              <TabsContent value="categories" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Preferred Job Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {jobCategories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={preferences.preferredCategories.includes(category)}
                            onCheckedChange={() => 
                              handleArrayToggle(preferences.preferredCategories, category, 'preferredCategories')
                            }
                          />
                          <Label htmlFor={category} className="text-sm font-medium">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Location Preferences */}
              <TabsContent value="location" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Preferred Locations */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">Preferred Locations</Label>
                      <div className="flex gap-2 mb-3">
                        <Input
                          placeholder="Add a location..."
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddItem(newLocation, 'preferredLocations', setNewLocation);
                            }
                          }}
                        />
                        <Button 
                          onClick={() => handleAddItem(newLocation, 'preferredLocations', setNewLocation)}
                          size="sm"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Popular Locations */}
                      <div className="mb-4">
                        <Label className="text-sm text-muted-foreground mb-2 block">Popular locations:</Label>
                        <div className="flex flex-wrap gap-2">
                          {popularLocations.map((location) => (
                            <Button
                              key={location}
                              variant="outline"
                              size="sm"
                              onClick={() => handleArrayToggle(preferences.preferredLocations, location, 'preferredLocations')}
                              className={preferences.preferredLocations.includes(location) ? 'bg-primary text-primary-foreground' : ''}
                            >
                              {location}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Selected Locations */}
                      {preferences.preferredLocations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {preferences.preferredLocations.map((location) => (
                            <Badge key={location} variant="secondary" className="flex items-center gap-1">
                              {location}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleRemoveItem(location, 'preferredLocations')}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Remote Work & Relocation */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remote-work"
                          checked={preferences.remoteWork}
                          onCheckedChange={(checked) => updatePreferences({ remoteWork: !!checked })}
                        />
                        <Label htmlFor="remote-work">Open to remote work</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="willing-relocate"
                          checked={preferences.willingToRelocate}
                          onCheckedChange={(checked) => updatePreferences({ willingToRelocate: !!checked })}
                        />
                        <Label htmlFor="willing-relocate">Willing to relocate</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Salary Preferences */}
              <TabsContent value="salary" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Salary Expectations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-base font-medium mb-3 block">Currency</Label>
                      <Select value={preferences.currency} onValueChange={(value) => updatePreferences({ currency: value })}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-3 block">
                        Salary Range: {preferences.currency === 'INR' ? '₹' : '$'}{preferences.minSalary.toLocaleString()} - {preferences.currency === 'INR' ? '₹' : '$'}{preferences.maxSalary.toLocaleString()}
                      </Label>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-muted-foreground mb-2 block">Minimum Salary</Label>
                          <Slider
                            value={[preferences.minSalary]}
                            onValueChange={([value]) => updatePreferences({ minSalary: value })}
                            max={preferences.currency === 'INR' ? 5000000 : 300000}
                            step={preferences.currency === 'INR' ? 50000 : 5000}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm text-muted-foreground mb-2 block">Maximum Salary</Label>
                          <Slider
                            value={[preferences.maxSalary]}
                            onValueChange={([value]) => updatePreferences({ maxSalary: value })}
                            max={preferences.currency === 'INR' ? 10000000 : 500000}
                            step={preferences.currency === 'INR' ? 50000 : 5000}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Job Details */}
              <TabsContent value="job-details" className="mt-6">
                <div className="space-y-6">
                  {/* Job Types */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {jobTypes.map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={type.value}
                              checked={preferences.jobTypes.includes(type.value)}
                              onCheckedChange={() => 
                                handleArrayToggle(preferences.jobTypes, type.value, 'jobTypes')
                              }
                            />
                            <Label htmlFor={type.value}>{type.label}</Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Experience Level */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Experience Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {experienceLevels.map((level) => (
                          <div key={level.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={level.value}
                              checked={preferences.experienceLevel.includes(level.value)}
                              onCheckedChange={() => 
                                handleArrayToggle(preferences.experienceLevel, level.value, 'experienceLevel')
                              }
                            />
                            <Label htmlFor={level.value}>{level.label}</Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Work Arrangement */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Work Arrangement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {workArrangements.map((arrangement) => (
                          <div key={arrangement.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={arrangement.value}
                              checked={preferences.workArrangement.includes(arrangement.value)}
                              onCheckedChange={() => 
                                handleArrayToggle(preferences.workArrangement, arrangement.value, 'workArrangement')
                              }
                            />
                            <Label htmlFor={arrangement.value}>{arrangement.label}</Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Company Size */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company Size
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {companySizes.map((size) => (
                          <div key={size.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={size.value}
                              checked={preferences.companySize.includes(size.value)}
                              onCheckedChange={() => 
                                handleArrayToggle(preferences.companySize, size.value, 'companySize')
                              }
                            />
                            <Label htmlFor={size.value}>{size.label}</Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Skills */}
              <TabsContent value="skills" className="mt-6">
                <div className="space-y-6">
                  {/* Required Skills */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Required Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="Add a required skill..."
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddItem(newSkill, 'requiredSkills', setNewSkill);
                            }
                          }}
                        />
                        <Button 
                          onClick={() => handleAddItem(newSkill, 'requiredSkills', setNewSkill)}
                          size="sm"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {preferences.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {preferences.requiredSkills.map((skill) => (
                            <Badge key={skill} variant="default" className="flex items-center gap-1">
                              {skill}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleRemoveItem(skill, 'requiredSkills')}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Exclude Keywords */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Exclude Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="Add keywords to exclude..."
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddItem(newKeyword, 'excludeKeywords', setNewKeyword);
                            }
                          }}
                        />
                        <Button 
                          onClick={() => handleAddItem(newKeyword, 'excludeKeywords', setNewKeyword)}
                          size="sm"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {preferences.excludeKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {preferences.excludeKeywords.map((keyword) => (
                            <Badge key={keyword} variant="destructive" className="flex items-center gap-1">
                              {keyword}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleRemoveItem(keyword, 'excludeKeywords')}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Notifications */}
              <TabsContent value="notifications" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email-notifications"
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked) => updatePreferences({ emailNotifications: !!checked })}
                      />
                      <Label htmlFor="email-notifications">Email notifications for new job matches</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="instant-notifications"
                        checked={preferences.instantNotifications}
                        onCheckedChange={(checked) => updatePreferences({ instantNotifications: !!checked })}
                      />
                      <Label htmlFor="instant-notifications">Instant notifications (browser/mobile)</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="weekly-digest"
                        checked={preferences.weeklyDigest}
                        onCheckedChange={(checked) => updatePreferences({ weeklyDigest: !!checked })}
                      />
                      <Label htmlFor="weekly-digest">Weekly job digest email</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Preferences;
