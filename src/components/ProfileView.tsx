import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { CareerProfile } from '../types';
import {
  UserCheck,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Tag,
  Briefcase,
  GraduationCap,
  FolderGit2,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getProfile();
      setProfile(res.profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load profile.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await api.updateProfile(profile);
      setProfile(res.profile);
      setSuccess('Career Twin profile successfully saved and updated in backend.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim() || !profile) return;
    const skillName = newSkill.trim();
    if (!profile.skills.includes(skillName)) {
      setProfile({
        ...profile,
        skills: [...profile.skills, skillName],
        technologies: [...profile.technologies, skillName],
      });
    }
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      skills: profile.skills.filter((s) => s !== skill),
      technologies: profile.technologies.filter((t) => t !== skill),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Verified Career Source
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Career Twin Profile
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured career background used to ground job matches, gap analyses, and mock interview prompts.
          </p>
        </div>

        <button
          id="save-profile-btn"
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 self-start sm:self-center"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Primary Details */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Core Career Direction
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Target Role / Position
            </label>
            <input
              type="text"
              value={profile.targetRole}
              onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Career Aspirations / Goals
            </label>
            <input
              type="text"
              value={profile.careerGoals}
              onChange={(e) => setProfile({ ...profile, careerGoals: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Professional Summary
          </label>
          <textarea
            rows={3}
            value={profile.summary}
            onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white leading-relaxed"
          />
        </div>
      </div>

      {/* Skills Management */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            Skills & Technical Competencies ({profile.skills.length})
          </h2>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add new skill (e.g. Docker, PostgreSQL, Go)..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {profile.skills.map((skill, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded border border-slate-200 transition-colors"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-slate-400 hover:text-red-600 transition-colors text-xs"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Experience Section */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-blue-600" />
          Employment Experience ({profile.experience.length})
        </h2>

        {profile.experience.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No experience history extracted yet.</p>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100">
            {profile.experience.map((exp, idx) => (
              <div key={idx} className="pt-2.5 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">
                    {exp.role} <span className="font-normal text-slate-500">at</span> {exp.company}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium font-mono">{exp.duration}</span>
                </div>
                <ul className="space-y-1">
                  {exp.highlights.map((h, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects Section */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <FolderGit2 className="w-3.5 h-3.5 text-purple-600" />
          Demonstrated Projects ({profile.projects.length})
        </h2>

        {profile.projects.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No projects recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.projects.map((proj, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900">{proj.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                {proj.technologies && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {proj.technologies.map((t, tidx) => (
                      <span
                        key={tidx}
                        className="px-1.5 py-0.5 bg-white text-slate-700 text-[10px] font-semibold rounded border border-slate-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education Section */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-green-600" />
          Education Credentials ({profile.education.length})
        </h2>

        {profile.education.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No education credentials recorded yet.</p>
        ) : (
          <div className="space-y-1.5">
            {profile.education.map((edu, i) => (
              <div key={i} className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{edu.degree}</h3>
                  <span className="text-[11px] text-slate-500">{edu.institution}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">{edu.year}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
